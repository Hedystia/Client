import type {
  GatewayVoiceServerUpdateDispatchData,
  GatewayVoiceStateUpdateDispatchData,
} from "discord-api-types/v10";
import type Client from "../client";
import VoiceConnection, { type VoiceState } from "./VoiceConnection";

export interface JoinVoiceChannelOptions {
  guildId: string;
  channelId: string;
  selfMute?: boolean;
  selfDeaf?: boolean;
}

/**
 * Voice manager for handling voice connections across guilds
 */
class VoiceManager {
  private client: Client;
  private connections: Map<string, VoiceConnection> = new Map();
  private voiceStates: Map<string, VoiceState> = new Map();

  constructor(client: Client) {
    this.client = client;
    this.client.on("voiceServerUpdate", (data) => this.handleVoiceServerUpdate(data));
    this.client.on("voiceStateUpdate", (data) => this.handleVoiceStateUpdate(data));
  }

  /**
   * Join a voice channel
   * @link https://discord.com/developers/topics/voice-connections#connecting-to-voice
   */
  public async joinVoiceChannel(options: JoinVoiceChannelOptions): Promise<VoiceConnection> {
    const { guildId, channelId, selfMute = false, selfDeaf = false } = options;

    // Check if we already have a connection for this guild
    const existingConnection = this.connections.get(guildId);
    if (existingConnection) {
      existingConnection.disconnect();
      this.connections.delete(guildId);
    }

    // Register the listeners before sending the update so fast gateway responses
    // cannot be missed between the two operations.
    const voiceStatePromise = this.waitForVoiceState(guildId);

    // Send voice state update to gateway
    await this.sendVoiceStateUpdate(guildId, channelId, selfMute, selfDeaf);

    // Wait for voice server update and state update
    const voiceState = await voiceStatePromise;

    // Create voice connection
    const connection = new VoiceConnection({
      serverId: guildId,
      userId: this.client.me?.id || "",
      sessionId: voiceState.sessionId,
      token: voiceState.token,
      endpoint: voiceState.endpoint ?? "",
      channelId,
    });

    this.connections.set(guildId, connection);

    // Handle connection events before opening the socket so failures cannot be missed.
    connection.on("close", () => {
      this.connections.delete(guildId);
    });
    connection.on("voiceError", (error) => this.client.emit("voiceError", error));
    connection.on("warn", (message) => this.client.emit("voiceWarn", message));
    connection.on("audio", (packet) => this.client.emit("voiceAudio", packet));

    await connection.connect();
    return connection;
  }

  /**
   * Leave a voice channel
   */
  public async leaveVoiceChannel(guildId: string): Promise<void> {
    const connection = this.connections.get(guildId);
    if (connection) {
      connection.disconnect();
      this.connections.delete(guildId);
    }

    // Send voice state update to disconnect
    await this.sendVoiceStateUpdate(guildId, null);

    this.voiceStates.delete(guildId);
  }

  /**
   * Get a voice connection by guild ID
   */
  public getConnection(guildId: string): VoiceConnection | undefined {
    return this.connections.get(guildId);
  }

  /**
   * Get all voice connections
   */
  public getConnections(): Map<string, VoiceConnection> {
    return new Map(this.connections);
  }

  /**
   * Send voice state update to gateway
   */
  private async sendVoiceStateUpdate(
    guildId: string,
    channelId: string | null,
    selfMute = false,
    selfDeaf = false,
  ): Promise<void> {
    if (!this.client.websocket) {
      throw new Error("Client is not connected");
    }

    await this.client.websocket.updateVoiceState({
      guild_id: guildId,
      channel_id: channelId,
      self_mute: selfMute,
      self_deaf: selfDeaf,
    });
  }

  /**
   * Wait for voice state and server update
   */
  private waitForVoiceState(guildId: string): Promise<VoiceState> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.client.off("voiceServerUpdate", handleVoiceServerUpdate);
        this.client.off("voiceStateUpdate", handleVoiceStateUpdate);
        reject(new Error("Timeout waiting for voice connection"));
      }, 30000);

      let sessionId: string | null = null;
      let token: string | null = null;
      let endpoint: string | null = null;

      const tryResolve = () => {
        if (sessionId && token && endpoint) {
          clearTimeout(timeout);
          this.client.off("voiceServerUpdate", handleVoiceServerUpdate);
          this.client.off("voiceStateUpdate", handleVoiceStateUpdate);
          resolve({
            sessionId,
            serverId: guildId,
            userId: this.client.me?.id || "",
            token: token as string,
            endpoint: endpoint as string,
          } as VoiceState);
        }
      };

      const handleVoiceServerUpdate = (data: GatewayVoiceServerUpdateDispatchData) => {
        if (data.guild_id === guildId) {
          token = data.token;
          endpoint = data.endpoint;
          tryResolve();
        }
      };

      const handleVoiceStateUpdate = (data: GatewayVoiceStateUpdateDispatchData) => {
        if (data.guild_id === guildId && data.user_id === this.client.me?.id && data.session_id) {
          sessionId = data.session_id;
          tryResolve();
        }
      };

      this.client.on("voiceServerUpdate", handleVoiceServerUpdate);
      this.client.on("voiceStateUpdate", handleVoiceStateUpdate);
    });
  }

  /**
   * Handle voice server update from client
   */
  public handleVoiceServerUpdate(data: GatewayVoiceServerUpdateDispatchData): void {
    const guildId = data.guild_id;
    if (guildId) {
      const existing = this.voiceStates.get(guildId);
      this.voiceStates.set(guildId, {
        ...existing,
        serverId: guildId,
        token: data.token,
        endpoint: data.endpoint,
      } as VoiceState);
      this.connections.get(guildId)?.updateServer(data.token, data.endpoint);
    }
  }

  /**
   * Handle voice state update from client
   */
  public handleVoiceStateUpdate(data: GatewayVoiceStateUpdateDispatchData): void {
    const guildId = data.guild_id;
    if (guildId && data.session_id) {
      const existing = this.voiceStates.get(guildId);
      this.voiceStates.set(guildId, {
        ...existing,
        serverId: guildId,
        sessionId: data.session_id,
        userId: this.client.me?.id || "",
        endpoint: existing?.endpoint ?? null,
        token: existing?.token ?? "",
        channelId: data.channel_id,
      } as VoiceState);
      this.connections.get(guildId)?.updateSession(data.session_id);
    }
  }
}

export default VoiceManager;
