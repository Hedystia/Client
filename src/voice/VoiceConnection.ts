import EventEmitter from "node:events";
import { VoiceCloseCodes, VoiceOpcodes } from "discord-api-types/voice";
import WebSocket from "ws";

type VoiceOpcodesType = (typeof VoiceOpcodes)[keyof typeof VoiceOpcodes];

export interface VoiceConnectionOptions {
  serverId: string;
  userId: string;
  sessionId: string;
  token: string;
  endpoint: string;
}

export interface VoiceState {
  sessionId: string;
  serverId: string;
  userId: string;
  token: string;
  endpoint: string | null;
}

export interface VoiceReadyData {
  ssrc: number;
  ip: string;
  port: number;
  modes: string[];
  heartbeat_interval?: number;
}

export interface VoiceSessionDescription {
  mode: string;
  secret_key: number[];
  dave_protocol_version?: number;
}

/**
 * Voice connection manager for Discord voice channels
 * @link https://discord.com/developers/topics/voice-connections
 */
class VoiceConnection extends EventEmitter {
  private ws: WebSocket | null = null;
  private state: VoiceState;
  private readyData: VoiceReadyData | null = null;
  private sessionDescription: VoiceSessionDescription | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private lastHeartbeat = 0;
  private lastHeartbeatAck = 0;
  private sequence = -1;
  private connected = false;
  private connecting = false;

  constructor(options: VoiceConnectionOptions) {
    super();

    this.state = {
      sessionId: options.sessionId,
      serverId: options.serverId,
      userId: options.userId,
      token: options.token,
      endpoint: options.endpoint,
    };
  }

  /**
   * Connect to the voice server
   * @link https://discord.com/developers/topics/voice-connections#establishing-a-voice-websocket-connection
   */
  public connect(): void {
    if (this.connecting || this.connected) {
      return;
    }

    this.connecting = true;

    // Ensure endpoint has wss:// prefix
    let endpoint = this.state.endpoint;
    if (!endpoint) {
      this.emit("error", new Error("No endpoint provided"));
      return;
    }

    if (!endpoint.startsWith("wss://") && !endpoint.startsWith("ws://")) {
      endpoint = `wss://${endpoint}`;
    }

    // Add version query parameter
    const url = `${endpoint}?v=8`;

    try {
      this.ws = new WebSocket(url);

      this.ws.on("open", () => this.onOpen());
      this.ws.on("message", (data: WebSocket.Data) => this.onMessage(data));
      this.ws.on("error", (error: Error) => this.onError(error));
      this.ws.on("close", (code: number, reason: Buffer) => this.onClose(code, reason));
    } catch (error) {
      this.emit("error", error as Error);
      this.connecting = false;
    }
  }

  /**
   * Disconnect from the voice server
   */
  public disconnect(): void {
    this.connected = false;
    this.connecting = false;

    this.clearTimers();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, "Client disconnect");
    }

    this.ws = null;
  }

  private clearTimers(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private onOpen(): void {
    this.connecting = false;
    this.connected = true;

    // Send Identify payload
    this.send({
      op: VoiceOpcodes.Identify,
      d: {
        server_id: this.state.serverId,
        user_id: this.state.userId,
        session_id: this.state.sessionId,
        token: this.state.token,
        max_dave_protocol_version: 1,
      },
    });
  }

  private onMessage(data: WebSocket.Data): void {
    let packet: {
      op: VoiceOpcodesType;
      d: unknown;
      seq?: number;
    };

    try {
      const stringData = data.toString();
      packet = JSON.parse(stringData);
    } catch (error) {
      this.emit("error", new Error(`Failed to parse voice packet: ${(error as Error).message}`));
      return;
    }

    // Update sequence number for buffered resume (v8+)
    if (packet.seq !== undefined) {
      this.sequence = packet.seq;
    }

    switch (packet.op) {
      case VoiceOpcodes.Ready: {
        const readyData = packet.d as VoiceReadyData;
        this.readyData = readyData;
        this.emit("ready", readyData);
        break;
      }

      case VoiceOpcodes.SessionDescription: {
        const sessionDesc = packet.d as VoiceSessionDescription;
        this.sessionDescription = sessionDesc;
        this.emit("sessionDescription", sessionDesc);
        break;
      }

      case VoiceOpcodes.Hello: {
        const helloData = packet.d as { heartbeat_interval: number };
        this.startHeartbeat(helloData.heartbeat_interval);
        this.emit("hello", helloData);
        break;
      }

      case VoiceOpcodes.HeartbeatAck:
        this.lastHeartbeatAck = Date.now();
        if (this.heartbeatTimeout) {
          clearTimeout(this.heartbeatTimeout);
          this.heartbeatTimeout = null;
        }
        break;

      case VoiceOpcodes.Speaking: {
        const speakingData = packet.d as { user_id: string; ssrc: number; speaking: number };
        this.emit("speaking", speakingData);
        break;
      }

      case VoiceOpcodes.ClientsConnect: {
        const connectData = packet.d as { user_id: string; ssrc: number };
        this.emit("clientConnect", connectData);
        break;
      }

      case VoiceOpcodes.ClientDisconnect: {
        const disconnectData = packet.d as { user_id: string; ssrc: number };
        this.emit("clientDisconnect", disconnectData);
        break;
      }

      case VoiceOpcodes.Resumed:
        this.emit("resumed");
        break;

      case VoiceOpcodes.DaveExecuteTransition:
      case VoiceOpcodes.DaveTransitionReady:
      case VoiceOpcodes.DavePrepareEpoch:
        // Handle DAVE protocol transitions if needed
        break;
    }
  }

  private onError(error: Error): void {
    this.emit("error", error);
  }

  private onClose(code: number, reason: Buffer): void {
    this.connected = false;
    this.connecting = false;
    this.clearTimers();

    const reasonStr = reason.toString();

    // Check if we should reconnect
    if (this.shouldReconnect(code)) {
      setTimeout(() => this.connect(), 1000);
    } else {
      this.emit("close", code, reasonStr);
    }
  }

  private shouldReconnect(code: number): boolean {
    const reconnectableCodes = new Set<number>([
      VoiceCloseCodes.UnknownOpcode,
      VoiceCloseCodes.FailedToDecode,
      VoiceCloseCodes.NotAuthenticated,
      VoiceCloseCodes.AlreadyAuthenticated,
      VoiceCloseCodes.SessionNoLongerValid,
      VoiceCloseCodes.SessionTimeout,
      VoiceCloseCodes.VoiceServerCrashed,
      VoiceCloseCodes.Disconnected,
      VoiceCloseCodes.UnknownProtocol,
    ]);

    return reconnectableCodes.has(code);
  }

  private startHeartbeat(interval: number): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random();
    const initialDelay = interval * jitter;

    setTimeout(() => {
      this.sendHeartbeat();
      this.startHeartbeatLoop(interval);
    }, initialDelay);
  }

  private startHeartbeatLoop(interval: number): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();

      // Set timeout for heartbeat ack
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout);
      }

      this.heartbeatTimeout = setTimeout(() => {
        this.emit("error", new Error("Heartbeat ACK timeout"));
        this.disconnect();
        this.connect();
      }, 60000);
    }, interval);
  }

  private sendHeartbeat(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.lastHeartbeat = Date.now();

      // Since v8, include seq_ack in heartbeat
      this.send({
        op: VoiceOpcodes.Heartbeat,
        d: {
          t: this.lastHeartbeat,
          seq_ack: this.sequence >= 0 ? this.sequence : undefined,
        },
      });
    }
  }

  private send(packet: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
    }
  }

  /**
   * Set speaking state
   * @link https://discord.com/developers/topics/voice-connections#speaking
   */
  public setSpeaking(speaking: boolean, ssrc?: number): void {
    if (!this.readyData) {
      return;
    }

    this.send({
      op: VoiceOpcodes.Speaking,
      d: {
        speaking: speaking ? 1 : 0,
        delay: 0,
        ssrc: ssrc || this.readyData.ssrc,
      },
    });
  }

  /**
   * Update voice state (move channels, mute, deaf)
   */
  public updateVoiceState(channelId: string | null, _selfMute = false, _selfDeaf = false): void {
    this.emit("stateUpdate", {
      ...this.state,
      endpoint: channelId ? this.state.endpoint : null,
    });
  }

  /**
   * Resume the voice connection
   * @link https://discord.com/developers/topics/voice-connections#resuming-voice-connection
   */
  public resume(): void {
    if (!this.state.sessionId) {
      return;
    }

    this.send({
      op: VoiceOpcodes.Resume,
      d: {
        server_id: this.state.serverId,
        session_id: this.state.sessionId,
        token: this.state.token,
        seq_ack: this.sequence >= 0 ? this.sequence : undefined,
      },
    });
  }

  /**
   * Get the current voice state
   */
  public getState(): VoiceState {
    return { ...this.state };
  }

  /**
   * Get the ready data
   */
  public getReadyData(): VoiceReadyData | null {
    return this.readyData;
  }

  /**
   * Get the session description
   */
  public getSessionDescription(): VoiceSessionDescription | null {
    return this.sessionDescription;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Check if ready to send audio
   */
  public isReady(): boolean {
    return this.connected && this.readyData !== null && this.sessionDescription !== null;
  }

  /**
   * Get the current ping
   */
  public getPing(): number {
    if (this.lastHeartbeatAck === 0 || this.lastHeartbeat === 0) {
      return -1;
    }
    return this.lastHeartbeatAck - this.lastHeartbeat;
  }
}

export default VoiceConnection;
