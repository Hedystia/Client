import EventEmitter from "node:events";
import type { WebSocketOptions } from "bun";
import {
  type ActivityType,
  type APIGatewayBotInfo,
  type APIUser,
  type GatewayOpcodes,
  type GatewayVoiceStateUpdateData,
  type PresenceUpdateReceiveStatus,
  PresenceUpdateStatus,
} from "discord-api-types/v10";
import ChannelManager from "../managers/ChannelManager";
import EmojiManager from "../managers/EmojiManager";
import EntitlementManager from "../managers/EntitlementManager";
import GuildBanManager from "../managers/GuildBanManager";
import GuildManager from "../managers/GuildManager";
import GuildScheduledEventManager from "../managers/GuildScheduledEventManager";
import IntegrationManager from "../managers/IntegrationManager";
import InviteManager from "../managers/InviteManager";
import MemberManager from "../managers/MemberManager";
import RoleManager from "../managers/RoleManager";
import SoundboardSoundManager from "../managers/SoundboardSoundManager";
import StageInstanceManager from "../managers/StageInstanceManager";
import StickerManager from "../managers/StickerManager";
import SubscriptionManager from "../managers/SubscriptionManager";
import ThreadMemberManager from "../managers/ThreadMemberManager";
import UserManager from "../managers/UserManager";
import WebhookManager from "../managers/WebhookManager";
import REST from "../rest";
import type { ClientEvents } from "../types/ClientEvents";
import type { Presence } from "../types/Gateway";
import type { CacheOptions } from "../utils/cache";
import { Routes } from "../utils/constants";
import type Intents from "../utils/intents";
import VoiceManager from "../voice/VoiceManager";
import { DefaultIdentifyProperties } from "./websocket/constants";
import { EventDispatcher } from "./websocket/events/EventDispatcher";
import { WebSocketManager, WebSocketManagerEvents } from "./websocket/WebSocketManager";
import type { WebSocketShard } from "./websocket/WebSocketShard";

/**
 * Cache configuration for individual managers
 */
export interface ManagerCacheConfig {
  /**
   * Whether caching is enabled for this manager
   * @defaultValue true
   */
  enabled?: boolean;

  /**
   * Maximum number of items to keep in cache
   * @defaultValue Infinity (unlimited)
   */
  maxSize?: number;

  /**
   * Time to live for items in milliseconds
   * @defaultValue undefined (items never expire)
   */
  ttl?: number;

  /**
   * Whether to enable dynamic TTL based on usage
   * @defaultValue false
   */
  dynamicTTL?: boolean;

  /**
   * Interval in milliseconds to run automatic cleanup
   * @defaultValue 60000 (1 minute)
   */
  cleanupInterval?: number;
}

/**
 * Global cache configuration for the client
 */
export interface CacheConfiguration {
  /**
   * Default cache options applied to all managers
   */
  defaults?: CacheOptions;

  /**
   * Per-manager cache configuration
   */
  managers?: {
    /** Cache config for users manager */
    users?: ManagerCacheConfig;
    /** Cache config for channels manager */
    channels?: ManagerCacheConfig;
    /** Cache config for guilds manager */
    guilds?: ManagerCacheConfig;
    /** Cache config for members manager */
    members?: ManagerCacheConfig;
    /** Cache config for roles manager */
    roles?: ManagerCacheConfig;
    /** Cache config for emojis manager */
    emojis?: ManagerCacheConfig;
    /** Cache config for stickers manager */
    stickers?: ManagerCacheConfig;
    /** Cache config for bans manager */
    bans?: ManagerCacheConfig;
    /** Cache config for scheduled events manager */
    scheduledEvents?: ManagerCacheConfig;
    /** Cache config for integrations manager */
    integrations?: ManagerCacheConfig;
    /** Cache config for invites manager */
    invites?: ManagerCacheConfig;
    /** Cache config for entitlements manager */
    entitlements?: ManagerCacheConfig;
    /** Cache config for stage instances manager */
    stageInstances?: ManagerCacheConfig;
    /** Cache config for subscriptions manager */
    subscriptions?: ManagerCacheConfig;
    /** Cache config for thread members manager */
    threadMembers?: ManagerCacheConfig;
    /** Cache config for soundboard sounds manager */
    soundboardSounds?: ManagerCacheConfig;
    /** Cache config for webhooks manager */
    webhooks?: ManagerCacheConfig;
  };
}

export interface ClientOptions {
  token: string;
  intents?: number | Array<number>;
  presence?: {
    activities: Activities[];
    status: PresenceUpdateReceiveStatus;
  };
  shards?: number | number[] | "auto";
  shardCount?: number;
  ws?: WebSocketOptions;
  compress?: boolean;
  largeThreshold?: number;
  shardsCount?: number | "auto";
  /**
   * Cache configuration for the client
   * Allows per-manager customization of cache behavior
   */
  cache?: CacheConfiguration;
}

interface Activities {
  name: string;
  type: ActivityType;
  url?: string;
  state?: string;
}

export default class Client extends EventEmitter<ClientEvents> {
  token: string;
  intents: Intents | number;
  rest: REST;
  presence: {
    activities: Activities[];
    status: PresenceUpdateReceiveStatus;
  };
  readyAt!: Date;
  me?: APIUser;
  ws?: WebSocketOptions;
  compress?: boolean;
  largeThreshold?: number;
  shardsCount: number | "auto";
  /**
   * High-level WebSocket manager that owns every shard.
   *
   * @remarks
   * Available after {@link Client.login} resolves.
   */
  websocket?: WebSocketManager;
  /**
   * Map of shard id to underlying {@link WebSocketShard}.
   *
   * @remarks
   * Backed by {@link Client.websocket}.shards. Updated each time the
   * manager spawns or removes a shard.
   */
  shards: Map<number, WebSocketShard>;
  users: UserManager;
  channels: ChannelManager;
  guilds: GuildManager;
  members: MemberManager;
  roles: RoleManager;
  emojis: EmojiManager;
  stickers: StickerManager;
  bans: GuildBanManager;
  scheduledEvents: GuildScheduledEventManager;
  integrations: IntegrationManager;
  invites: InviteManager;
  entitlements: EntitlementManager;
  stageInstances: StageInstanceManager;
  subscriptions: SubscriptionManager;
  threadMembers: ThreadMemberManager;
  soundboardSounds: SoundboardSoundManager;
  webhooks: WebhookManager;
  voice: VoiceManager;

  private dispatcher: EventDispatcher;

  constructor(options: ClientOptions) {
    super();

    this.token = `Bot ${options.token}`;

    this.intents =
      options.intents !== undefined
        ? Array.isArray(options.intents)
          ? options.intents.reduce((sum, num) => sum + num, 0)
          : options.intents
        : 0;

    this.compress = options.compress;
    this.largeThreshold = options.largeThreshold;
    this.shardsCount = options.shardsCount ?? "auto";

    this.shards = new Map();
    this.users = new UserManager(this);
    this.channels = new ChannelManager(this);
    this.guilds = new GuildManager(this);
    this.members = new MemberManager(this);
    this.roles = new RoleManager(this);
    this.emojis = new EmojiManager(this);
    this.stickers = new StickerManager(this);
    this.bans = new GuildBanManager(this);
    this.scheduledEvents = new GuildScheduledEventManager(this);
    this.integrations = new IntegrationManager(this);
    this.invites = new InviteManager(this);
    this.entitlements = new EntitlementManager(this);
    this.stageInstances = new StageInstanceManager(this);
    this.subscriptions = new SubscriptionManager(this);
    this.threadMembers = new ThreadMemberManager(this);
    this.soundboardSounds = new SoundboardSoundManager(this);
    this.webhooks = new WebhookManager(this);
    this.voice = new VoiceManager(this);

    this.rest = new REST({
      token: this.token,
      version: 10,
      restRequestTimeout: 10000,
    });

    this.presence = {
      activities: [...(options.presence?.activities ?? [])],
      status: options.presence?.status ?? PresenceUpdateStatus.Online,
    };

    this.ws = options?.ws;

    this.dispatcher = new EventDispatcher(this);
  }

  /**
   * Logs in to the gateway, spawning every required shard.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway#connecting}
   */
  async login(): Promise<void> {
    const gatewayInformation = await this.getGatewayBot();
    if (this.shardsCount === "auto") {
      this.shardsCount = gatewayInformation.shards;
    }

    const manager = new WebSocketManager({
      token: options_token(this.token),
      intents: typeof this.intents === "number" ? this.intents : Number(this.intents),
      shardCount: this.shardsCount,
      identifyProperties: DefaultIdentifyProperties,
      gatewayInformation: toAPIGatewayBotInfo(gatewayInformation),
      largeThreshold: this.largeThreshold,
      compress: this.compress,
      presence: this.presence?.activities
        ? {
            activities: this.presence.activities.map((activity) => ({
              name: activity.name,
              type: activity.type,
              url: activity.url,
              state: activity.state,
            })),
            status: this.presence.status,
            since: null,
            afk: false,
          }
        : undefined,
      handlePayload: (shardId, packet) => {
        this.emit("dispatch", packet, shardId);
        this.dispatcher.dispatch(packet);
      },
    });

    this.websocket = manager;
    this.shards = manager.shards;

    manager.on(WebSocketManagerEvents.ShardReady, (id) => this.emit("shardReady", id));
    manager.on(WebSocketManagerEvents.ShardDisconnect, ({ shardId, code }) =>
      this.emit("shardDisconnect", { id: shardId, code }),
    );
    manager.on(WebSocketManagerEvents.ShardReconnecting, (id) =>
      this.emit("shardReconnecting", id),
    );
    manager.on(WebSocketManagerEvents.ShardError, (data) => this.emit("shardError", data));
    manager.on(WebSocketManagerEvents.Hello, (interval, id) => this.emit("hello", interval, id));
    manager.on(WebSocketManagerEvents.HeartbeatAck, (id) => this.emit("heartbeatACK", id));

    await manager.connect();
  }

  /**
   * Disconnects every shard and clears the manager.
   */
  disconnect(): void {
    this.websocket?.destroy();
  }

  get uptime(): number {
    if (!this.readyAt) {
      throw new Error("Client is not ready");
    }
    return Date.now() - this.readyAt.getTime();
  }

  get isReady(): boolean {
    return this.readyAt !== undefined;
  }

  get readyTimestamp(): number {
    if (!this.readyAt) {
      throw new Error("Client is not ready");
    }
    return this.readyAt.getTime();
  }

  get ping(): number {
    return this.websocket?.latency ?? 0;
  }

  /**
   * Updates the presence of the bot across every shard.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway#update-presence}
   */
  updatePresence(options: Partial<Pick<Presence, "activities" | "status">>): void {
    this.presence = {
      ...this.presence,
      ...options,
    };

    this.websocket?.broadcastPresence({
      activities:
        this.presence.activities.map((activity) => ({
          name: activity.name,
          type: activity.type,
          url: activity.url,
          state: activity.state,
        })) ?? [],
      status: this.presence.status,
      since: null,
      afk: false,
    });
  }

  /**
   * Updates the bot voice state for the given guild.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway#update-voice-state}
   */
  updateVoiceState(data: GatewayVoiceStateUpdateData): void {
    this.websocket?.updateVoiceState(data);
  }

  /**
   * Sends a raw gateway payload through the appropriate shard.
   */
  async sendToShard(shardId: number, op: GatewayOpcodes, data: unknown): Promise<void> {
    if (!this.websocket) {
      throw new Error("Client is not connected");
    }
    await this.websocket.send(shardId, { op, d: data } as Parameters<WebSocketManager["send"]>[1]);
  }

  /**
   * Gets the gateway bot information
   * @link https://discord.com/developers/docs/topics/gateway#get-gateway-bot
   */
  async getGatewayBot(): Promise<{
    url: string;
    shards: number;
    sessionStartLimit: {
      total: number;
      remaining: number;
      resetAfter: number;
      maxConcurrency: number;
    };
  }> {
    const response = (await this.rest.get(Routes.gatewayBot())) as APIGatewayBotInfo;
    return {
      url: response.url,
      shards: response.shards,
      sessionStartLimit: {
        total: response.session_start_limit.total,
        remaining: response.session_start_limit.remaining,
        resetAfter: response.session_start_limit.reset_after,
        maxConcurrency: response.session_start_limit.max_concurrency,
      },
    };
  }

  /**
   * Registers application commands globally
   * @param commands - Array of command data
   * @returns The registered commands
   * @link https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
   */
  async registerCommands(commands: unknown[]): Promise<unknown[]> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.put(Routes.applicationCommands(this.me.id), {
      body: commands,
    }) as Promise<unknown[]>;
  }

  /**
   * Registers application commands for a specific guild (faster for testing)
   * @param guildId - The guild ID
   * @param commands - Array of command data
   * @returns The registered commands
   * @link https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-guild-application-commands
   */
  async registerGuildCommands(guildId: string, commands: unknown[]): Promise<unknown[]> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.put(Routes.applicationGuildCommands(this.me.id, guildId), {
      body: commands,
    }) as Promise<unknown[]>;
  }

  /**
   * Deletes all global application commands
   * @returns Empty array
   */
  async deleteAllCommands(): Promise<unknown[]> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.put(Routes.applicationCommands(this.me.id), {
      body: [],
    }) as Promise<unknown[]>;
  }

  /**
   * Deletes all application commands for a specific guild
   * @param guildId - The guild ID
   * @returns Empty array
   */
  async deleteAllGuildCommands(guildId: string): Promise<unknown[]> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.put(Routes.applicationGuildCommands(this.me.id, guildId), {
      body: [],
    }) as Promise<unknown[]>;
  }

  /**
   * Fetches all global application commands
   * @returns Array of commands
   */
  async fetchCommands(): Promise<unknown[]> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.get(Routes.applicationCommands(this.me.id)) as Promise<unknown[]>;
  }

  /**
   * Fetches all application commands for a specific guild
   * @param guildId - The guild ID
   * @returns Array of commands
   */
  async fetchGuildCommands(guildId: string): Promise<unknown[]> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.get(Routes.applicationGuildCommands(this.me.id, guildId)) as Promise<
      unknown[]
    >;
  }

  /**
   * Updates a specific global application command
   * @param commandId - The command ID
   * @param data - The updated command data
   * @returns The updated command
   */
  async updateCommand(commandId: string, data: unknown): Promise<unknown> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.patch(Routes.applicationCommand(this.me.id, commandId), {
      body: data,
    }) as Promise<unknown>;
  }

  /**
   * Updates a specific guild application command
   * @param guildId - The guild ID
   * @param commandId - The command ID
   * @param data - The updated command data
   * @returns The updated command
   */
  async updateGuildCommand(guildId: string, commandId: string, data: unknown): Promise<unknown> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.patch(Routes.applicationGuildCommand(this.me.id, guildId, commandId), {
      body: data,
    }) as Promise<unknown>;
  }

  /**
   * Deletes a specific global application command
   * @param commandId - The command ID
   */
  async deleteCommand(commandId: string): Promise<void> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    await this.rest.delete(Routes.applicationCommand(this.me.id, commandId));
  }

  /**
   * Deletes a specific guild application command
   * @param guildId - The guild ID
   * @param commandId - The command ID
   */
  async deleteGuildCommand(guildId: string, commandId: string): Promise<void> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    await this.rest.delete(Routes.applicationGuildCommand(this.me.id, guildId, commandId));
  }
}

/**
 * Strips the `Bot ` prefix the client adds in the constructor.
 */
function options_token(token: string): string {
  return token.startsWith("Bot ") ? token.slice(4) : token;
}

/**
 * Converts the camelCased gateway info returned by {@link Client.getGatewayBot}
 * back into the snake_case shape expected by {@link WebSocketManager}.
 */
function toAPIGatewayBotInfo(info: {
  url: string;
  shards: number;
  sessionStartLimit: {
    total: number;
    remaining: number;
    resetAfter: number;
    maxConcurrency: number;
  };
}): APIGatewayBotInfo {
  return {
    url: info.url,
    shards: info.shards,
    session_start_limit: {
      total: info.sessionStartLimit.total,
      remaining: info.sessionStartLimit.remaining,
      reset_after: info.sessionStartLimit.resetAfter,
      max_concurrency: info.sessionStartLimit.maxConcurrency,
    },
  };
}
