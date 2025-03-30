import type Client from "@/client";

// Events
import ApplicationCommandPermissionsUpdate from "@/events/applicationCommandPermissionsUpdate";
import AutoModerationActionExecution from "@/events/autoModerationActionExecution";
import AutoModerationRuleCreate from "@/events/autoModerationRuleCreate";
import AutoModerationRuleDelete from "@/events/autoModerationRuleDelete";
import AutoModerationRuleUpdate from "@/events/autoModerationRuleUpdate";
import ChannelCreate from "@/events/channelCreate";
import ChannelDelete from "@/events/channelDelete";
import ChannelPinsUpdate from "@/events/channelPinsUpdate";
import ChannelUpdate from "@/events/channelUpdate";
import EntitlementCreate from "@/events/entitlementCreate";
import EntitlementDelete from "@/events/entitlementDelete";
import EntitlementUpdate from "@/events/entitlementUpdate";
import GuildAuditLogEntryCreate from "@/events/guildAuditLogEntryCreate";
import GuildBanAdd from "@/events/guildBanAdd";
import GuildBanRemove from "@/events/guildBanRemove";
import GuildCreate from "@/events/guildCreate";
import GuildDelete from "@/events/guildDelete";
import GuildEmojisUpdate from "@/events/guildEmojisUpdate";
import GuildIntegrationsUpdate from "@/events/guildIntegrationsUpdate";
import GuildMemberAdd from "@/events/guildMemberAdd";
import GuildMemberRemove from "@/events/guildMemberRemove";
import GuildMembersChunk from "@/events/guildMembersChunk";
import GuildMemberUpdate from "@/events/guildMemberUpdate";
import GuildRoleCreate from "@/events/guildRoleCreate";
import GuildRoleDelete from "@/events/guildRoleDelete";
import GuildRoleUpdate from "@/events/guildRoleUpdate";
import GuildScheduledEventCreate from "@/events/guildScheduledEventCreate";
import GuildScheduledEventDelete from "@/events/guildScheduledEventDelete";
import GuildScheduledEventUpdate from "@/events/guildScheduledEventUpdate";
import GuildScheduledEventUserAdd from "@/events/guildScheduledEventUserAdd";
import GuildScheduledEventUserRemove from "@/events/guildScheduledEventUserRemove";
import GuildSoundboardSoundCreate from "@/events/guildSoundboardSoundCreate";
import GuildSoundboardSoundDelete from "@/events/guildSoundboardSoundDelete";
import GuildSoundboardSoundsUpdate from "@/events/guildSoundboardSoundsUpdate";
import GuildSoundboardSoundUpdate from "@/events/guildSoundboardSoundUpdate";
import SoundboardSounds from "@/events/soundboardSounds";
import GuildStickersUpdate from "@/events/guildStickersUpdate";
import GuildUpdate from "@/events/guildUpdate";
import IntegrationCreate from "@/events/integrationCreate";
import IntegrationDelete from "@/events/integrationDelete";
import IntegrationUpdate from "@/events/integrationUpdate";
import InteractionCreate from "@/events/interactionCreate";
import InviteCreate from "@/events/inviteCreate";
import InviteDelete from "@/events/inviteDelete";
import MessageCreate from "@/events/messageCreate";
import MessageDelete from "@/events/messageDelete";
import MessageDeleteBulk from "@/events/messageDeleteBulk";
import MessagePollVoteAdd from "@/events/messagePollVoteAdd";
import MessagePollVoteRemove from "@/events/messagePollVoteRemove";
import MessageReactionAdd from "@/events/messageReactionAdd";
import MessageReactionRemove from "@/events/messageReactionRemove";
import MessageReactionRemoveAll from "@/events/messageReactionRemoveAll";
import MessageReactionRemoveEmoji from "@/events/messageReactionRemoveEmoji";
import MessageUpdate from "@/events/messageUpdate";
import PresenceUpdate from "@/events/presenceUpdate";
import Ready from "@/events/ready";
import Resumed from "@/events/resumed";
import StageInstanceCreate from "@/events/stageInstanceCreate";
import StageInstanceDelete from "@/events/stageInstanceDelete";
import StageInstanceUpdate from "@/events/stageInstanceUpdate";
import SubscriptionCreate from "@/events/subscriptionCreate";
import SubscriptionDelete from "@/events/subscriptionDelete";
import SubscriptionUpdate from "@/events/subscriptionUpdate";
import ThreadCreate from "@/events/threadCreate";
import ThreadDelete from "@/events/threadDelete";
import ThreadListSync from "@/events/threadListSync";
import ThreadMembersUpdate from "@/events/threadMembersUpdate";
import ThreadMemberUpdate from "@/events/threadMemberUpdate";
import ThreadUpdate from "@/events/threadUpdate";
import TypingStart from "@/events/typingStart";
import UserUpdate from "@/events/userUpdate";
import VoiceChannelEffectSend from "@/events/voiceChannelEffectSend";
import VoiceServerUpdate from "@/events/voiceServerUpdate";
import VoiceStateUpdate from "@/events/voiceStateUpdate";
import WebhooksUpdate from "@/events/webhooksUpdate";

import { OpCodes } from "@/utils/constants";
import { GatewayDispatchEvents } from "discord-api-types/v10";
import process from "node:process";
import ws from "ws";
import { EventEmitter } from "node:events";

export default class WebSocketManager extends EventEmitter {
  client: Client;
  connection!: ws;
  connected!: boolean;
  resumeGatewayUrl!: string;
  interval!: NodeJS.Timer;
  sequence!: number;
  lastHeartbeat = 0;
  lastHeartbeatAck = 0;
  ping = 0;
  sessionId!: string;
  shardId: number;
  shardCount: number;
  status: "disconnected" | "connecting" | "connected" | "ready" = "disconnected";
  closeSequence = 0;
  reconnectAttempts = 0;
  maxReconnectAttempts = 10;
  reconnectTimeout?: NodeJS.Timeout;

  constructor(client: Client, shardId = 0, shardCount = 1) {
    super();
    this.client = client;
    this.shardId = shardId;
    this.shardCount = shardCount;
  }

  async connect(): Promise<void> {
    if (this.client.intents === undefined) {
      throw new Error("Intents are not defined");
    }

    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }

      if (this.shardId === 0 && this.status === "disconnected") {
        await this.client.rest.get("/users/@me").catch(() => {
          throw new Error("Invalid token");
        });
      }

      this.status = "connecting";
      const url = this.getGateway();
      this.connection = new ws(url);

      this.connection.on("open", () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.emit("open");

        if (this.sessionId && this.sequence) {
          this.resume();
        } else {
          this.identify();
        }
      });

      this.connection.on("close", (code) => {
        this.connected = false;
        this.status = "disconnected";
        clearInterval(this.interval);
        this.emit("close", code);

        if ([4004, 4010, 4011, 4012, 4013, 4014].includes(code)) {
          return;
        }

        if (code === 1000) {
          this.reconnectTimeout = setTimeout(() => this.connect(), 2000) as NodeJS.Timeout;
          return;
        }

        if (code === 4005) {
          this.sessionId = "";
          this.sequence = 0;
          this.reconnectTimeout = setTimeout(() => this.connect(), 5000) as NodeJS.Timeout;
          return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * 2 ** this.reconnectAttempts + Math.random() * 1000, 30000);
          this.reconnectTimeout = setTimeout(() => this.connect(), delay) as NodeJS.Timeout;
        } else {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts = 0;
            this.connect();
          }, 60000) as NodeJS.Timeout;
        }
      });

      this.connection.on("error", (error) => {
        this.emit("error", error);
      });

      this.connection.on("message", async (data) => {
        const d = JSON.parse(data.toString());
        this.handleMessage(d);
      });
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  handleMessage(d: any) {
    switch (d.op) {
      case OpCodes.Hello:
        if (this.interval) clearInterval(this.interval);

        this.send({ op: 1, d: this.sequence || null });
        this.lastHeartbeat = Date.now();
        this.lastHeartbeatAck = Date.now();

        this.interval = setInterval(() => {
          if (this.lastHeartbeat > 0 && this.lastHeartbeatAck < this.lastHeartbeat) {
            this.connection.close(1001);
            return;
          }

          this.send({ op: 1, d: this.sequence || null });
          this.lastHeartbeat = Date.now();
        }, d.d.heartbeat_interval);
        break;

      case OpCodes.Heartbeat_Ack:
        this.lastHeartbeatAck = Date.now();
        this.ping = this.lastHeartbeatAck - this.lastHeartbeat;
        break;

      case OpCodes.Heartbeat:
        this.send({ op: 1, d: this.sequence || null });
        this.lastHeartbeat = Date.now();
        break;

      case OpCodes.Reconnect:
        this.connection.close(1001);
        break;

      case OpCodes.Invalid_Session:
        if (d.d) {
          setTimeout(() => this.resume(), 2500);
        } else {
          this.sessionId = "";
          this.sequence = 0;
          setTimeout(() => this.identify(), 5000);
        }
        break;

      case OpCodes.Dispatch:
        {
          this.sequence = d.s;
          const event = d.t;

          if (event === GatewayDispatchEvents.Ready) {
            this.sessionId = d.d.session_id;
            this.resumeGatewayUrl = d.d.resume_gateway_url;
            this.status = "ready";
            this.emit("ready");
          } else if (event === GatewayDispatchEvents.Resumed) {
            this.status = "ready";
            this.emit("resume");
          }

          switch (event) {
            // APPLICATION
            case GatewayDispatchEvents.ApplicationCommandPermissionsUpdate:
              return new ApplicationCommandPermissionsUpdate(this.client, d);

            // AUTO MODERATION
            case GatewayDispatchEvents.AutoModerationActionExecution:
              return new AutoModerationActionExecution(this.client, d);
            case GatewayDispatchEvents.AutoModerationRuleCreate:
              return new AutoModerationRuleCreate(this.client, d);
            case GatewayDispatchEvents.AutoModerationRuleDelete:
              return new AutoModerationRuleDelete(this.client, d);
            case GatewayDispatchEvents.AutoModerationRuleUpdate:
              return new AutoModerationRuleUpdate(this.client, d);

            // CHANNEL
            case GatewayDispatchEvents.ChannelCreate:
              return new ChannelCreate(this.client, d);
            case GatewayDispatchEvents.ChannelDelete:
              return new ChannelDelete(this.client, d);
            case GatewayDispatchEvents.ChannelPinsUpdate:
              return new ChannelPinsUpdate(this.client, d);
            case GatewayDispatchEvents.ChannelUpdate:
              return new ChannelUpdate(this.client, d);

            // ENTITLEMENT
            case GatewayDispatchEvents.EntitlementCreate:
              return new EntitlementCreate(this.client, d);
            case GatewayDispatchEvents.EntitlementDelete:
              return new EntitlementDelete(this.client, d);
            case GatewayDispatchEvents.EntitlementUpdate:
              return new EntitlementUpdate(this.client, d);

            // GUILD
            case GatewayDispatchEvents.GuildAuditLogEntryCreate:
              return new GuildAuditLogEntryCreate(this.client, d);
            case GatewayDispatchEvents.GuildBanAdd:
              return new GuildBanAdd(this.client, d);
            case GatewayDispatchEvents.GuildBanRemove:
              return new GuildBanRemove(this.client, d);
            case GatewayDispatchEvents.GuildCreate:
              return new GuildCreate(this.client, d);
            case GatewayDispatchEvents.GuildDelete:
              return new GuildDelete(this.client, d);
            case GatewayDispatchEvents.GuildEmojisUpdate:
              return new GuildEmojisUpdate(this.client, d);
            case GatewayDispatchEvents.GuildIntegrationsUpdate:
              return new GuildIntegrationsUpdate(this.client, d);
            case GatewayDispatchEvents.GuildMemberAdd:
              return new GuildMemberAdd(this.client, d);
            case GatewayDispatchEvents.GuildMemberRemove:
              return new GuildMemberRemove(this.client, d);
            case GatewayDispatchEvents.GuildMembersChunk:
              return new GuildMembersChunk(this.client, d);
            case GatewayDispatchEvents.GuildMemberUpdate:
              return new GuildMemberUpdate(this.client, d);
            case GatewayDispatchEvents.GuildRoleCreate:
              return new GuildRoleCreate(this.client, d);
            case GatewayDispatchEvents.GuildRoleDelete:
              return new GuildRoleDelete(this.client, d);
            case GatewayDispatchEvents.GuildRoleUpdate:
              return new GuildRoleUpdate(this.client, d);
            case GatewayDispatchEvents.GuildScheduledEventCreate:
              return new GuildScheduledEventCreate(this.client, d);
            case GatewayDispatchEvents.GuildScheduledEventDelete:
              return new GuildScheduledEventDelete(this.client, d);
            case GatewayDispatchEvents.GuildScheduledEventUpdate:
              return new GuildScheduledEventUpdate(this.client, d);
            case GatewayDispatchEvents.GuildScheduledEventUserAdd:
              return new GuildScheduledEventUserAdd(this.client, d);
            case GatewayDispatchEvents.GuildScheduledEventUserRemove:
              return new GuildScheduledEventUserRemove(this.client, d);
            case GatewayDispatchEvents.GuildSoundboardSoundCreate:
              return new GuildSoundboardSoundCreate(this.client, d);
            case GatewayDispatchEvents.GuildSoundboardSoundDelete:
              return new GuildSoundboardSoundDelete(this.client, d);
            case GatewayDispatchEvents.GuildSoundboardSoundsUpdate:
              return new GuildSoundboardSoundsUpdate(this.client, d);
            case GatewayDispatchEvents.GuildSoundboardSoundUpdate:
              return new GuildSoundboardSoundUpdate(this.client, d);
            case GatewayDispatchEvents.GuildStickersUpdate:
              return new GuildStickersUpdate(this.client, d);
            case GatewayDispatchEvents.GuildUpdate:
              return new GuildUpdate(this.client, d);

            // SOUNDBOARD
            case GatewayDispatchEvents.SoundboardSounds:
              return new SoundboardSounds(this.client, d);

            // INTEGRATION
            case GatewayDispatchEvents.IntegrationCreate:
              return new IntegrationCreate(this.client, d);
            case GatewayDispatchEvents.IntegrationDelete:
              return new IntegrationDelete(this.client, d);
            case GatewayDispatchEvents.IntegrationUpdate:
              return new IntegrationUpdate(this.client, d);

            // INTERACTION
            case GatewayDispatchEvents.InteractionCreate:
              return new InteractionCreate(this.client, d);

            // INVITE
            case GatewayDispatchEvents.InviteCreate:
              return new InviteCreate(this.client, d);
            case GatewayDispatchEvents.InviteDelete:
              return new InviteDelete(this.client, d);

            // MESSAGE
            case GatewayDispatchEvents.MessageCreate:
              return new MessageCreate(this.client, d);
            case GatewayDispatchEvents.MessageDelete:
              return new MessageDelete(this.client, d);
            case GatewayDispatchEvents.MessageDeleteBulk:
              return new MessageDeleteBulk(this.client, d);
            case GatewayDispatchEvents.MessagePollVoteAdd:
              return new MessagePollVoteAdd(this.client, d);
            case GatewayDispatchEvents.MessagePollVoteRemove:
              return new MessagePollVoteRemove(this.client, d);
            case GatewayDispatchEvents.MessageReactionAdd:
              return new MessageReactionAdd(this.client, d);
            case GatewayDispatchEvents.MessageReactionRemove:
              return new MessageReactionRemove(this.client, d);
            case GatewayDispatchEvents.MessageReactionRemoveAll:
              return new MessageReactionRemoveAll(this.client, d);
            case GatewayDispatchEvents.MessageReactionRemoveEmoji:
              return new MessageReactionRemoveEmoji(this.client, d);
            case GatewayDispatchEvents.MessageUpdate:
              return new MessageUpdate(this.client, d);

            // PRESENCE
            case GatewayDispatchEvents.PresenceUpdate:
              return new PresenceUpdate(this.client, d);

            // READY
            case GatewayDispatchEvents.Ready:
              return new Ready(this.client, d);

            // RESUMED
            case GatewayDispatchEvents.Resumed:
              return new Resumed(this.client, d);

            // STAGE
            case GatewayDispatchEvents.StageInstanceCreate:
              return new StageInstanceCreate(this.client, d);
            case GatewayDispatchEvents.StageInstanceDelete:
              return new StageInstanceDelete(this.client, d);
            case GatewayDispatchEvents.StageInstanceUpdate:
              return new StageInstanceUpdate(this.client, d);

            // SUBSCRIPTION
            case GatewayDispatchEvents.SubscriptionCreate:
              return new SubscriptionCreate(this.client, d);
            case GatewayDispatchEvents.SubscriptionDelete:
              return new SubscriptionDelete(this.client, d);
            case GatewayDispatchEvents.SubscriptionUpdate:
              return new SubscriptionUpdate(this.client, d);

            // THREAD
            case GatewayDispatchEvents.ThreadCreate:
              return new ThreadCreate(this.client, d);
            case GatewayDispatchEvents.ThreadDelete:
              return new ThreadDelete(this.client, d);
            case GatewayDispatchEvents.ThreadListSync:
              return new ThreadListSync(this.client, d);
            case GatewayDispatchEvents.ThreadMembersUpdate:
              return new ThreadMembersUpdate(this.client, d);
            case GatewayDispatchEvents.ThreadMemberUpdate:
              return new ThreadMemberUpdate(this.client, d);
            case GatewayDispatchEvents.ThreadUpdate:
              return new ThreadUpdate(this.client, d);

            // TYPING
            case GatewayDispatchEvents.TypingStart:
              return new TypingStart(this.client, d);

            // USER
            case GatewayDispatchEvents.UserUpdate:
              return new UserUpdate(this.client, d);

            // VOICE
            case GatewayDispatchEvents.VoiceChannelEffectSend:
              return new VoiceChannelEffectSend(this.client, d);
            case GatewayDispatchEvents.VoiceServerUpdate:
              return new VoiceServerUpdate(this.client, d);
            case GatewayDispatchEvents.VoiceStateUpdate:
              return new VoiceStateUpdate(this.client, d);

            // WEBHOOK
            case GatewayDispatchEvents.WebhooksUpdate:
              return new WebhooksUpdate(this.client, d);
          }
        }
        break;
    }
  }

  identify(): void {
    this.send({
      op: 2,
      d: {
        token: this.client.token,
        intents: this.client.intents,
        properties: {
          os: process.platform,
          browser: "hedystia.js",
          device: "hedystia.js",
        },
        shard: [this.shardId, this.shardCount],
        presence: this.client.presence,
      },
    });
  }

  resume(): void {
    this.send({
      op: 6,
      d: {
        token: this.client.token,
        session_id: this.sessionId,
        seq: this.sequence,
      },
    });
  }

  send(data: object): void {
    if (this.connected && this.connection && this.connection.readyState === ws.OPEN) {
      try {
        this.connection.send(JSON.stringify(data));
      } catch (error) {
        this.emit("error", error);
        if (this.connection.readyState !== ws.OPEN) {
          this.connection.close(1001);
        }
      }
    }
  }

  getGateway(): string {
    return `${
      this.connected && this.resumeGatewayUrl ? this.resumeGatewayUrl : "wss://gateway.discord.gg/"
    }?v=10&encoding=json`;
  }

  get isReady(): boolean {
    return this.status === "ready";
  }
}
