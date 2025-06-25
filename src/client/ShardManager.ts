import {
  ActivityType,
  GatewayCloseCodes,
  GatewayDispatchEvents,
  type GatewayDispatchPayload,
  GatewayOpcodes,
  type GatewayReceivePayload,
  type GatewayVoiceStateUpdateData,
  PresenceUpdateStatus,
} from "discord-api-types/v10";
import type Client from "../client";
import { GatewayError } from "../errors/Gateway";
// Events
import ApplicationCommandPermissionsUpdate from "../events/applicationCommandPermissionsUpdate";
import AutoModerationActionExecution from "../events/autoModerationActionExecution";
import AutoModerationRuleCreate from "../events/autoModerationRuleCreate";
import AutoModerationRuleDelete from "../events/autoModerationRuleDelete";
import AutoModerationRuleUpdate from "../events/autoModerationRuleUpdate";
import ChannelCreate from "../events/channelCreate";
import ChannelDelete from "../events/channelDelete";
import ChannelPinsUpdate from "../events/channelPinsUpdate";
import ChannelUpdate from "../events/channelUpdate";
import EntitlementCreate from "../events/entitlementCreate";
import EntitlementDelete from "../events/entitlementDelete";
import EntitlementUpdate from "../events/entitlementUpdate";
import GuildAuditLogEntryCreate from "../events/guildAuditLogEntryCreate";
import GuildBanAdd from "../events/guildBanAdd";
import GuildBanRemove from "../events/guildBanRemove";
import GuildCreate from "../events/guildCreate";
import GuildDelete from "../events/guildDelete";
import GuildEmojisUpdate from "../events/guildEmojisUpdate";
import GuildIntegrationsUpdate from "../events/guildIntegrationsUpdate";
import GuildMemberAdd from "../events/guildMemberAdd";
import GuildMemberRemove from "../events/guildMemberRemove";
import GuildMembersChunk from "../events/guildMembersChunk";
import GuildMemberUpdate from "../events/guildMemberUpdate";
import GuildRoleCreate from "../events/guildRoleCreate";
import GuildRoleDelete from "../events/guildRoleDelete";
import GuildRoleUpdate from "../events/guildRoleUpdate";
import GuildScheduledEventCreate from "../events/guildScheduledEventCreate";
import GuildScheduledEventDelete from "../events/guildScheduledEventDelete";
import GuildScheduledEventUpdate from "../events/guildScheduledEventUpdate";
import GuildScheduledEventUserAdd from "../events/guildScheduledEventUserAdd";
import GuildScheduledEventUserRemove from "../events/guildScheduledEventUserRemove";
import GuildSoundboardSoundCreate from "../events/guildSoundboardSoundCreate";
import GuildSoundboardSoundDelete from "../events/guildSoundboardSoundDelete";
import GuildSoundboardSoundsUpdate from "../events/guildSoundboardSoundsUpdate";
import GuildSoundboardSoundUpdate from "../events/guildSoundboardSoundUpdate";
import GuildStickersUpdate from "../events/guildStickersUpdate";
import GuildUpdate from "../events/guildUpdate";
import IntegrationCreate from "../events/integrationCreate";
import IntegrationDelete from "../events/integrationDelete";
import IntegrationUpdate from "../events/integrationUpdate";
import InteractionCreate from "../events/interactionCreate";
import InviteCreate from "../events/inviteCreate";
import InviteDelete from "../events/inviteDelete";
import MessageCreate from "../events/messageCreate";
import MessageDelete from "../events/messageDelete";
import MessageDeleteBulk from "../events/messageDeleteBulk";
import MessagePollVoteAdd from "../events/messagePollVoteAdd";
import MessagePollVoteRemove from "../events/messagePollVoteRemove";
import MessageReactionAdd from "../events/messageReactionAdd";
import MessageReactionRemove from "../events/messageReactionRemove";
import MessageReactionRemoveAll from "../events/messageReactionRemoveAll";
import MessageReactionRemoveEmoji from "../events/messageReactionRemoveEmoji";
import MessageUpdate from "../events/messageUpdate";
import PresenceUpdate from "../events/presenceUpdate";
import Ready from "../events/ready";
import Resumed from "../events/resumed";
import SoundboardSounds from "../events/soundboardSounds";
import StageInstanceCreate from "../events/stageInstanceCreate";
import StageInstanceDelete from "../events/stageInstanceDelete";
import StageInstanceUpdate from "../events/stageInstanceUpdate";
import SubscriptionCreate from "../events/subscriptionCreate";
import SubscriptionDelete from "../events/subscriptionDelete";
import SubscriptionUpdate from "../events/subscriptionUpdate";
import ThreadCreate from "../events/threadCreate";
import ThreadDelete from "../events/threadDelete";
import ThreadListSync from "../events/threadListSync";
import ThreadMembersUpdate from "../events/threadMembersUpdate";
import ThreadMemberUpdate from "../events/threadMemberUpdate";
import ThreadUpdate from "../events/threadUpdate";
import TypingStart from "../events/typingStart";
import UserUpdate from "../events/userUpdate";
import VoiceChannelEffectSend from "../events/voiceChannelEffectSend";
import VoiceServerUpdate from "../events/voiceServerUpdate";
import VoiceStateUpdate from "../events/voiceStateUpdate";
import WebhooksUpdate from "../events/webhooksUpdate";
import type { Identify, Presence } from "../types/Gateway";

export default class ShardManager {
  id: number;
  private heartbeatInterval: NodeJS.Timer | null;
  client: Client;
  ws: WebSocket;
  sessionId: string | null;
  resumeGatewayUrl: string | null;
  ping = 0;
  lastHeartbeat = 0;
  lastHeartbeatAck = 0;
  defaultUrl: string;
  sequence = 0;

  /**
   * Creates a new ShardManager
   * @param {number} id The shard's id
   * @param {Client} client The client
   */
  constructor(id: number, client: Client) {
    this.id = id;
    this.heartbeatInterval = null;
    this.client = client;
    this.sessionId = null;
    this.resumeGatewayUrl = null;
    this.defaultUrl = "wss://gateway.discord.gg/?v=10&encoding=json";
    this.ws = new WebSocket(this.defaultUrl);
  }

  /**
   * Connects to the gateway
   * @link https://discord.com/developers/docs/topics/gateway#connections
   */
  public connect(url?: string): void {
    if (url) {
      this.ws = new WebSocket(url);
    }

    this.ws.onopen = () => this.onWebSocketOpen();
    this.ws.onmessage = (event) => this.onWebSocketMessage(event.data);
    this.ws.onerror = (event) => this.onWebSocketError(event);
    this.ws.onclose = (event) => this.onWebSocketClose(event.code, Buffer.from(event.reason));
  }

  /**
   * Disconnects from the gateway
   * @link https://discord.com/developers/docs/topics/gateway#connections
   */
  public disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Heartbeats the gateway
   * @param {number | null} lastSequence The last sequence number
   * @link https://discord.com/developers/docs/topics/gateway-events#heartbeat
   */
  public heartbeat(lastSequence: number | null): void {
    this.ws.send(
      JSON.stringify({
        op: GatewayOpcodes.Heartbeat,
        d: lastSequence,
      }),
    );
  }

  /**
   * Sends an identify packet to the gateway
   * @param {Identify} options The options to send
   * @link https://discord.com/developers/docs/topics/gateway#identify
   */
  public identify(options: Identify): void {
    this.ws.send(
      JSON.stringify({
        op: GatewayOpcodes.Identify,
        d: {
          token: options.token,
          properties: {
            os: options.properties.os,
            browser: options.properties.browser,
            device: options.properties.device,
          },
          compress: options.compress,
          large_threshold: options.largeThreshold,
          shard: options.shard,
          presence: options.presence,
          intents: options.intents,
        },
      }),
    );
  }

  /**
   * Sends a heartbeat to the gateway
   * @param {GatewayDispatchPayload} packet The packet data
   */
  private onDispatch(packet: GatewayDispatchPayload): void {
    this.client.emit("dispatch", packet, this.id);

    switch (packet.t) {
      // APPLICATION
      case GatewayDispatchEvents.ApplicationCommandPermissionsUpdate:
        new ApplicationCommandPermissionsUpdate(this.client, packet);
        break;

      // AUTO MODERATION
      case GatewayDispatchEvents.AutoModerationActionExecution:
        new AutoModerationActionExecution(this.client, packet);
        break;
      case GatewayDispatchEvents.AutoModerationRuleCreate:
        new AutoModerationRuleCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.AutoModerationRuleDelete:
        new AutoModerationRuleDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.AutoModerationRuleUpdate:
        new AutoModerationRuleUpdate(this.client, packet);
        break;

      // CHANNEL
      case GatewayDispatchEvents.ChannelCreate:
        new ChannelCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.ChannelDelete:
        new ChannelDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.ChannelPinsUpdate:
        new ChannelPinsUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.ChannelUpdate:
        new ChannelUpdate(this.client, packet);
        break;

      // ENTITLEMENT
      case GatewayDispatchEvents.EntitlementCreate:
        new EntitlementCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.EntitlementDelete:
        new EntitlementDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.EntitlementUpdate:
        new EntitlementUpdate(this.client, packet);
        break;

      // GUILD
      case GatewayDispatchEvents.GuildAuditLogEntryCreate:
        new GuildAuditLogEntryCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildBanAdd:
        new GuildBanAdd(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildBanRemove:
        new GuildBanRemove(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildCreate:
        new GuildCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildDelete:
        new GuildDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildEmojisUpdate:
        new GuildEmojisUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildIntegrationsUpdate:
        new GuildIntegrationsUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildMemberAdd:
        new GuildMemberAdd(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildMemberRemove:
        new GuildMemberRemove(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildMembersChunk:
        new GuildMembersChunk(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildMemberUpdate:
        new GuildMemberUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildRoleCreate:
        new GuildRoleCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildRoleDelete:
        new GuildRoleDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildRoleUpdate:
        new GuildRoleUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventCreate:
        new GuildScheduledEventCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventDelete:
        new GuildScheduledEventDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventUpdate:
        new GuildScheduledEventUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventUserAdd:
        new GuildScheduledEventUserAdd(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventUserRemove:
        new GuildScheduledEventUserRemove(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildSoundboardSoundCreate:
        new GuildSoundboardSoundCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildSoundboardSoundDelete:
        new GuildSoundboardSoundDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildSoundboardSoundsUpdate:
        new GuildSoundboardSoundsUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildSoundboardSoundUpdate:
        new GuildSoundboardSoundUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildStickersUpdate:
        new GuildStickersUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.GuildUpdate:
        new GuildUpdate(this.client, packet);
        break;

      // SOUNDBOARD
      case GatewayDispatchEvents.SoundboardSounds:
        new SoundboardSounds(this.client, packet);
        break;

      // INTEGRATION
      case GatewayDispatchEvents.IntegrationCreate:
        new IntegrationCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.IntegrationDelete:
        new IntegrationDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.IntegrationUpdate:
        new IntegrationUpdate(this.client, packet);
        break;

      // INTERACTION
      case GatewayDispatchEvents.InteractionCreate:
        new InteractionCreate(this.client, packet);
        break;

      // INVITE
      case GatewayDispatchEvents.InviteCreate:
        new InviteCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.InviteDelete:
        new InviteDelete(this.client, packet);
        break;

      // MESSAGE
      case GatewayDispatchEvents.MessageCreate:
        new MessageCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.MessageDelete:
        new MessageDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.MessageDeleteBulk:
        new MessageDeleteBulk(this.client, packet);
        break;
      case GatewayDispatchEvents.MessagePollVoteAdd:
        new MessagePollVoteAdd(this.client, packet);
        break;
      case GatewayDispatchEvents.MessagePollVoteRemove:
        new MessagePollVoteRemove(this.client, packet);
        break;
      case GatewayDispatchEvents.MessageReactionAdd:
        new MessageReactionAdd(this.client, packet);
        break;
      case GatewayDispatchEvents.MessageReactionRemove:
        new MessageReactionRemove(this.client, packet);
        break;
      case GatewayDispatchEvents.MessageReactionRemoveAll:
        new MessageReactionRemoveAll(this.client, packet);
        break;
      case GatewayDispatchEvents.MessageReactionRemoveEmoji:
        new MessageReactionRemoveEmoji(this.client, packet);
        break;
      case GatewayDispatchEvents.MessageUpdate:
        new MessageUpdate(this.client, packet);
        break;

      // PRESENCE
      case GatewayDispatchEvents.PresenceUpdate:
        new PresenceUpdate(this.client, packet);
        break;

      // READY
      case GatewayDispatchEvents.Ready:
        {
          this.client.emit("shardReady", this.id);
          this.sessionId = packet.d.session_id;
          this.resumeGatewayUrl = packet.d.resume_gateway_url;
          new Ready(this.client, packet);
        }
        break;

      // RESUMED
      case GatewayDispatchEvents.Resumed:
        new Resumed(this.client);
        break;

      // STAGE
      case GatewayDispatchEvents.StageInstanceCreate:
        new StageInstanceCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.StageInstanceDelete:
        new StageInstanceDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.StageInstanceUpdate:
        new StageInstanceUpdate(this.client, packet);
        break;

      // SUBSCRIPTION
      case GatewayDispatchEvents.SubscriptionCreate:
        new SubscriptionCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.SubscriptionDelete:
        new SubscriptionDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.SubscriptionUpdate:
        new SubscriptionUpdate(this.client, packet);
        break;

      // THREAD
      case GatewayDispatchEvents.ThreadCreate:
        new ThreadCreate(this.client, packet);
        break;
      case GatewayDispatchEvents.ThreadDelete:
        new ThreadDelete(this.client, packet);
        break;
      case GatewayDispatchEvents.ThreadListSync:
        new ThreadListSync(this.client, packet);
        break;
      case GatewayDispatchEvents.ThreadMembersUpdate:
        new ThreadMembersUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.ThreadMemberUpdate:
        new ThreadMemberUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.ThreadUpdate:
        new ThreadUpdate(this.client, packet);
        break;

      // TYPING
      case GatewayDispatchEvents.TypingStart:
        new TypingStart(this.client, packet);
        break;

      // USER
      case GatewayDispatchEvents.UserUpdate:
        new UserUpdate(this.client, packet);
        break;

      // VOICE
      case GatewayDispatchEvents.VoiceChannelEffectSend:
        new VoiceChannelEffectSend(this.client, packet);
        break;
      case GatewayDispatchEvents.VoiceServerUpdate:
        new VoiceServerUpdate(this.client, packet);
        break;
      case GatewayDispatchEvents.VoiceStateUpdate:
        new VoiceStateUpdate(this.client, packet);
        break;

      // WEBHOOK
      case GatewayDispatchEvents.WebhooksUpdate:
        new WebhooksUpdate(this.client, packet);
        break;
    }
  }

  /**
   * Opens the websocket connection
   */
  private onWebSocketOpen(): void {
    this.identify({
      token: this.client.token,
      properties: {
        os: process.platform,
        browser: "hedystia.js",
        device: "hedystia.js",
      },
      compress: this.client.compress,
      largeThreshold: this.client.largeThreshold,
      shard: [this.id, this.client.shardsCount as number],
      presence:
        this.client.presence !== undefined
          ? {
              activities: this.client.presence.activities?.map((activity) => ({
                name: activity.type === ActivityType.Custom ? "Custom Status" : activity.name,
                type: activity.type,
                url: activity.url,
                state: activity.state,
              })),
              status: this.client.presence.status ?? PresenceUpdateStatus.Online,
            }
          : undefined,
      intents: this.client.intents,
    });
  }

  /**
   * Handles incoming messages from the websocket
   * @param {string | Buffer | ArrayBuffer} data The raw data received from the websocket
   */
  private onWebSocketMessage(data: string | Buffer | ArrayBuffer): void {
    const packet = JSON.parse(data.toString()) as GatewayReceivePayload;

    if (packet.s) {
      this.sequence = packet.s;
    }

    switch (packet.op) {
      case GatewayOpcodes.Dispatch:
        this.onDispatch(packet);
        break;
      case GatewayOpcodes.Reconnect:
        this.client.emit("reconnect");
        this.client.emit("shardReconnecting", this.id);
        this.disconnect();
        this.connect();
        break;
      case GatewayOpcodes.InvalidSession:
        this.client.emit("invalidSession");
        break;
      case GatewayOpcodes.Hello:
        {
          this.heartbeatInterval = setInterval(
            () => this.heartbeat(null),
            packet.d.heartbeat_interval,
          );

          this.client.emit("hello", packet.d.heartbeat_interval, this.id);
        }
        break;
      case GatewayOpcodes.HeartbeatAck:
        this.lastHeartbeatAck = Date.now();
        this.client.emit("heartbeatACK", this.id);
        this.ping = this.lastHeartbeatAck - this.lastHeartbeat;
        break;

      case GatewayOpcodes.Heartbeat:
        this.client.emit("heartbeat", this.id);
        this.lastHeartbeat = Date.now();
        this.sendHeartbeat();
        break;
    }
  }

  /**
   * Sends a heartbeat to the gateway
   * @link https://discord.com/developers/docs/topics/gateway#heartbeating
   */
  sendHeartbeat(): void {
    this.ws.send(
      JSON.stringify({
        op: GatewayOpcodes.Heartbeat,
        d: this.sequence,
        s: null,
        t: null,
      }),
    );
  }

  /**
   * Checks if the code is reconnectable
   * @param {number} code The code to check
   * @link https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-gateway-close-event-codes
   * @returns {boolean} Whether the code is reconnectable
   */
  shouldReconnect(code: number): boolean {
    const codesThatCanReconnect = new Set([
      /**
       * We're not sure what went wrong. Try reconnecting?
       */
      GatewayCloseCodes.UnknownError,
      /**
       * You sent an invalid Gateway opcode or an invalid payload for an opcode. Don't do that!
       *
       * See https://discord.com/developers/docs/topics/gateway-events#payload-structure
       */
      GatewayCloseCodes.UnknownOpcode,
      /**
       * You sent an invalid payload to us. Don't do that!
       *
       * See https://discord.com/developers/docs/topics/gateway#sending-events
       */
      GatewayCloseCodes.DecodeError,
      /**
       * You sent us a payload prior to identifying
       *
       * See https://discord.com/developers/docs/topics/gateway-events#identify
       */
      GatewayCloseCodes.NotAuthenticated,
      /**
       * You sent more than one identify payload. Don't do that!
       */
      GatewayCloseCodes.AlreadyAuthenticated,
      /**
       * The sequence sent when resuming the session was invalid. Reconnect and start a new session
       *
       * See https://discord.com/developers/docs/topics/gateway-events#resume
       */
      GatewayCloseCodes.InvalidSeq,
      /**
       * Woah nelly! You're sending payloads to us too quickly. Slow it down! You will be disconnected on receiving this
       */
      GatewayCloseCodes.RateLimited,
      /**
       * Your session timed out. Reconnect and start a new one
       */
      GatewayCloseCodes.SessionTimedOut,
    ]);

    return codesThatCanReconnect.has(code);
  }

  /**
   * Handles errors from the websocket
   * @param {Event} event The event received from the websocket
   */
  private onWebSocketError(event: Event): void {
    this.client.emit("shardError", {
      id: this.id,
      error: new Error(`WebSocket error occurred with type "${event.type}"`),
    });

    throw new Error(`WebSocket error occurred on shard ${this.id}`);
  }

  /**
   * Handles closing from the websocket
   * @param {number} code The code received from the websocket
   * @param {Buffer} reason The reason received from the websocket
   */
  private onWebSocketClose(code: number, reason: Buffer): void {
    if (code === 1000) {
      return;
    }
    if (code === 3000) {
      return;
    }
    if (code === GatewayCloseCodes.InvalidShard) {
      throw new Error("Invalid Shard");
    }
    if (code === GatewayCloseCodes.ShardingRequired) {
      throw new Error("Sharding Required");
    }
    if (code === GatewayCloseCodes.InvalidAPIVersion) {
      throw new Error("Invalid API Version");
    }
    if (code === GatewayCloseCodes.InvalidIntents) {
      throw new Error("Invalid intent(s)");
    }
    if (code === GatewayCloseCodes.DisallowedIntents) {
      throw new Error("Disallowed intent(s)");
    }

    if (code === 1001 || typeof code === "undefined" || code === 1006) {
      this.resumeWithUrl();
      return;
    }

    this.client.emit("shardDisconnect", { id: this.id, code });

    if (this.shouldReconnect(code)) {
      this.client.emit("shardReconnecting", this.id);
      this.disconnect();
      this.connect();
      return;
    }

    throw new GatewayError(code, reason.toString());
  }

  /**
   * Resumes the session
   * @param {string} options.token The token to resume with
   * @param {string} options.sessionId The session ID to resume with
   * @param {number} options.seq The sequence number to resume with
   * @link https://discord.com/developers/docs/topics/gateway#resume
   */
  resume(options: { token: string; sessionId: string; seq: number }): void {
    this.ws.send(
      JSON.stringify({
        op: GatewayOpcodes.Resume,
        d: {
          token: options.token,
          session_id: options.sessionId,
          seq: options.seq,
        },
      }),
    );
  }

  /**
   * Resumes the session with the url
   * @link https://discord.com/developers/docs/topics/gateway#resuming
   */
  resumeWithUrl(): void {
    this.connect(`${this.resumeGatewayUrl}/?v=10&encoding=json`);
  }

  /**
   * Updates the presence of the bot
   * @param {Partial<Pick<Presence, "activities" | "status">>} options The options to update the presence with
   * @link https://discord.com/developers/docs/topics/gateway#update-presence
   */
  updatePresence(options: Partial<Pick<Presence, "activities" | "status">>): void {
    this.ws.send(
      JSON.stringify({
        op: GatewayOpcodes.PresenceUpdate,
        d: {
          activities: options.activities?.map((activity) => ({
            name: activity.type === ActivityType.Custom ? "Custom Status" : activity.name,
            type: activity.type,
            url: activity.url,
            state: activity.state,
          })),
          status: options.status ?? PresenceUpdateStatus.Online,
        },
      }),
    );
  }

  /**
   * Updates the voice state of the bot
   * @param {GatewayVoiceStateUpdateData} options The options to update the voice state with
   * @link https://discord.com/developers/docs/topics/gateway#update-voice-state
   */
  updateVoiceState(options: GatewayVoiceStateUpdateData): void {
    this.ws.send(
      JSON.stringify({
        op: GatewayOpcodes.VoiceStateUpdate,
        d: {
          guild_id: options.guild_id,
          channel_id: options.channel_id,
          self_mute: options.self_mute,
          self_deaf: options.self_deaf,
        },
      }),
    );
  }
}
