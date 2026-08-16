import EventEmitter from "node:events";
import type { WebSocketOptions } from "bun";
import {
  type APIGatewayBotInfo,
  type APISKU,
  type APIUser,
  type GatewayActivityUpdateData,
  type GatewayOpcodes,
  type GatewayRequestChannelInfoData,
  type GatewayRequestGuildMembersData,
  type GatewaySendPayload,
  type GatewayVoiceStateUpdateData,
  type PresenceUpdateReceiveStatus,
  PresenceUpdateStatus,
  type RESTGetAPIApplicationActivityInstanceResult,
  type RESTGetAPIApplicationCommandsResult,
  type RESTGetAPIApplicationGuildCommandsResult,
  type RESTGetAPIApplicationRoleConnectionMetadataResult,
  type RESTGetAPIVoiceRegionsResult,
  type RESTGetCurrentApplicationResult,
  type RESTPatchAPIApplicationCommandJSONBody,
  type RESTPatchAPIApplicationCommandResult,
  type RESTPatchAPIApplicationGuildCommandJSONBody,
  type RESTPatchAPIApplicationGuildCommandResult,
  type RESTPatchCurrentApplicationJSONBody,
  type RESTPatchCurrentApplicationResult,
  type RESTPutAPIApplicationCommandsJSONBody,
  type RESTPutAPIApplicationCommandsResult,
  type RESTPutAPIApplicationGuildCommandsJSONBody,
  type RESTPutAPIApplicationGuildCommandsResult,
  type RESTPutAPIApplicationRoleConnectionMetadataJSONBody,
  type RESTPutAPIApplicationRoleConnectionMetadataResult,
} from "discord-api-types/v10";
import ApplicationCommandManager from "../managers/ApplicationCommandManager";
import ApplicationEmojiManager from "../managers/ApplicationEmojiManager";
import AutoModerationRuleManager from "../managers/AutoModerationRuleManager";
import ChannelManager from "../managers/ChannelManager";
import EmojiManager from "../managers/EmojiManager";
import EntitlementManager from "../managers/EntitlementManager";
import GuildBanManager from "../managers/GuildBanManager";
import GuildManager from "../managers/GuildManager";
import GuildScheduledEventManager from "../managers/GuildScheduledEventManager";
import GuildTemplateManager from "../managers/GuildTemplateManager";
import IntegrationManager from "../managers/IntegrationManager";
import InviteManager from "../managers/InviteManager";
import MemberManager from "../managers/MemberManager";
import OAuth2Manager from "../managers/OAuth2Manager";
import RoleManager from "../managers/RoleManager";
import SkuManager from "../managers/SkuManager";
import SoundboardSoundManager from "../managers/SoundboardSoundManager";
import StageInstanceManager from "../managers/StageInstanceManager";
import StickerManager from "../managers/StickerManager";
import StickerPackManager from "../managers/StickerPackManager";
import SubscriptionManager from "../managers/SubscriptionManager";
import ThreadMemberManager from "../managers/ThreadMemberManager";
import UserManager from "../managers/UserManager";
import WebhookManager from "../managers/WebhookManager";
import REST from "../rest";
import type { MessageStructureInstance } from "../structures/MessageStructure";
import type { UserStructureInstance } from "../structures/UserStructure";
import type { ClientEvents } from "../types/ClientEvents";
import type { Presence } from "../types/Gateway";
import type { Collection } from "../utils/Collection";
import type { CacheOptions } from "../utils/cache";
import Cache from "../utils/cache";
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
    /** Cache config for auto-moderation rules manager */
    autoModerationRules?: ManagerCacheConfig;
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
    /** Cache config for messages */
    messages?: ManagerCacheConfig;
  };
}

export interface ClientOptions {
  /** Optional token; it may also be supplied to {@link Client.login}. */
  token?: string;
  intents?: number | Array<number>;
  presence?: {
    activities: Activities[];
    status: PresenceUpdateReceiveStatus;
  };
  /** Total shard count, specific shard IDs, or `"auto"` to use Discord's recommendation. */
  shards?: number | number[] | "auto";
  /** Total number of shards to identify with. */
  shardCount?: number;
  ws?: WebSocketOptions;
  compress?: boolean;
  largeThreshold?: number;
  /** Backwards-compatible alias for `shardCount`. */
  shardsCount?: number | "auto";
  /**
   * Cache configuration for the client
   * Allows per-manager customization of cache behavior
   */
  cache?: CacheConfiguration;
}

type Activities = GatewayActivityUpdateData;

export default class Client extends EventEmitter<ClientEvents> {
  token: string;
  intents: Intents | number;
  rest: REST;
  presence: {
    activities: Activities[];
    status: PresenceUpdateReceiveStatus;
  };
  readyAt?: Date;
  me?: APIUser;
  /** Active gateway manager, available after login. */
  ws?: WebSocketManager;
  /** WebSocket construction options. */
  wsOptions?: WebSocketOptions;
  compress?: boolean;
  largeThreshold?: number;
  shardsCount: number | "auto";
  /** Specific shard IDs to spawn when `ClientOptions.shards` is an array. */
  shardIds?: number[];
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
  /** Cached messages keyed by message ID. */
  messages: Cache<string, MessageStructureInstance>;
  application: {
    commands: ApplicationCommandManager;
    emojis: ApplicationEmojiManager;
    skus: SkuManager;
    fetchSKUs: () => Promise<Collection<string, APISKU>>;
    fetch: () => Promise<RESTGetCurrentApplicationResult | null>;
    edit: (
      data: RESTPatchCurrentApplicationJSONBody,
    ) => Promise<RESTPatchCurrentApplicationResult | null>;
    fetchActivityInstance: (
      instanceId: string,
    ) => Promise<RESTGetAPIApplicationActivityInstanceResult | null>;
    roleConnectionMetadata: {
      fetch: () => Promise<RESTGetAPIApplicationRoleConnectionMetadataResult | null>;
      set: (
        data: RESTPutAPIApplicationRoleConnectionMetadataJSONBody,
      ) => Promise<RESTPutAPIApplicationRoleConnectionMetadataResult | null>;
    };
  };
  autoModerationRules: AutoModerationRuleManager;
  channels: ChannelManager;
  guilds: GuildManager;
  members: MemberManager;
  roles: RoleManager;
  emojis: EmojiManager;
  stickers: StickerManager;
  stickerPacks: StickerPackManager;
  bans: GuildBanManager;
  scheduledEvents: GuildScheduledEventManager;
  templates: GuildTemplateManager;
  integrations: IntegrationManager;
  invites: InviteManager;
  entitlements: EntitlementManager;
  stageInstances: StageInstanceManager;
  subscriptions: SubscriptionManager;
  threadMembers: ThreadMemberManager;
  soundboardSounds: SoundboardSoundManager;
  webhooks: WebhookManager;
  oauth2: OAuth2Manager;
  voice: VoiceManager;

  private dispatcher: EventDispatcher;
  private readonly readyShards = new Set<number>();

  constructor(options: ClientOptions) {
    super();

    this.token = options.token ? `Bot ${options.token}` : "";

    this.intents =
      options.intents !== undefined
        ? Array.isArray(options.intents)
          ? options.intents.reduce((sum, num) => sum + num, 0)
          : options.intents
        : 0;

    this.compress = options.compress;
    this.largeThreshold = options.largeThreshold;
    this.shardsCount =
      options.shardsCount ??
      options.shardCount ??
      (typeof options.shards === "number" ? options.shards : "auto");
    this.shardIds = Array.isArray(options.shards) ? [...options.shards] : undefined;

    this.shards = new Map();
    this.users = new UserManager(this, options.cache?.managers?.users);
    const messageCacheConfig = options.cache?.managers?.messages;
    this.messages = new Cache<string, MessageStructureInstance>({
      enabled: messageCacheConfig?.enabled,
      maxSize: messageCacheConfig?.maxSize,
      ttl: messageCacheConfig?.ttl,
      dynamicTTL: messageCacheConfig?.dynamicTTL,
      cleanupInterval: messageCacheConfig?.cleanupInterval,
    });
    const skus = new SkuManager(this);
    this.application = {
      commands: new ApplicationCommandManager(this),
      emojis: new ApplicationEmojiManager(this),
      skus,
      fetchSKUs: () => skus.fetch(),
      fetch: () => this.fetchApplication(),
      edit: (data) => this.editApplication(data),
      fetchActivityInstance: (instanceId) => this.fetchApplicationActivityInstance(instanceId),
      roleConnectionMetadata: {
        fetch: () => this.fetchApplicationRoleConnectionMetadata(),
        set: (data) => this.setApplicationRoleConnectionMetadata(data),
      },
    };
    this.autoModerationRules = new AutoModerationRuleManager(this);
    this.channels = new ChannelManager(this);
    this.guilds = new GuildManager(this);
    this.members = new MemberManager(this, options.cache?.managers?.members);
    this.roles = new RoleManager(this);
    this.emojis = new EmojiManager(this);
    this.stickers = new StickerManager(this);
    this.stickerPacks = new StickerPackManager(this);
    this.bans = new GuildBanManager(this);
    this.scheduledEvents = new GuildScheduledEventManager(this);
    this.templates = new GuildTemplateManager(this);
    this.integrations = new IntegrationManager(this);
    this.invites = new InviteManager(this);
    this.entitlements = new EntitlementManager(this);
    this.stageInstances = new StageInstanceManager(this);
    this.subscriptions = new SubscriptionManager(this);
    this.threadMembers = new ThreadMemberManager(this);
    this.soundboardSounds = new SoundboardSoundManager(this);
    this.webhooks = new WebhookManager(this);
    this.oauth2 = new OAuth2Manager(this);
    this.voice = new VoiceManager(this);
    this.configureManagerCaches(options.cache?.managers);

    this.rest = new REST({
      token: this.token,
      version: 10,
      restRequestTimeout: 10000,
    });

    this.presence = {
      activities: [...(options.presence?.activities ?? [])],
      status:
        options.presence?.status ?? (PresenceUpdateStatus.Online as PresenceUpdateReceiveStatus),
    };

    this.wsOptions = options?.ws;

    this.dispatcher = new EventDispatcher(this);
  }

  /**
   * Applies per-manager cache configuration after all managers have been created.
   */
  private configureManagerCaches(config?: CacheConfiguration["managers"]): void {
    this.configureCache(this.users.cache, config?.users);
    this.configureCache(this.channels.cache, config?.channels);
    this.configureCache(this.guilds.cache, config?.guilds);
    this.configureCache(this.roles.cache, config?.roles);
    this.configureCache(this.emojis.cache, config?.emojis);
    this.configureCache(this.stickers.cache, config?.stickers);
    this.configureCache(this.bans.cache, config?.bans);
    this.configureCache(this.autoModerationRules.cache, config?.autoModerationRules);
    this.configureCache(this.scheduledEvents.cache, config?.scheduledEvents);
    this.configureCache(this.integrations.cache, config?.integrations);
    this.configureCache(this.invites.cache, config?.invites);
    this.configureCache(this.entitlements.cache, config?.entitlements);
    this.configureCache(this.stageInstances.cache, config?.stageInstances);
    this.configureCache(this.subscriptions.cache, config?.subscriptions);
    this.configureCache(this.threadMembers.cache, config?.threadMembers);
    this.configureCache(this.soundboardSounds.cache, config?.soundboardSounds);
    this.configureCache(this.webhooks.cache, config?.webhooks);
    this.configureCache(this.messages, config?.messages);
  }

  private configureCache<K, V>(cache: Cache<K, V>, config?: ManagerCacheConfig): void {
    if (!config) {
      return;
    }
    cache.configure(config);
  }

  /**
   * Logs in to the gateway, spawning every required shard.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway#connecting}
   */
  async login(token?: string): Promise<string> {
    if (token) {
      this.token = token.startsWith("Bot ") ? token : `Bot ${token}`;
      this.rest?.setToken(this.token);
    }
    if (!this.token) {
      throw new Error("A Discord token is required to login");
    }
    this.readyShards.clear();
    const gatewayInformation = await this.getGatewayBot();
    if (this.shardsCount === "auto") {
      this.shardsCount = gatewayInformation.shards;
    }

    const manager = new WebSocketManager({
      token: options_token(this.token),
      intents: typeof this.intents === "number" ? this.intents : Number(this.intents),
      shardCount: this.shardsCount,
      shardIds: this.shardIds,
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
            status: this.presence.status as PresenceUpdateStatus,
            since: null,
            afk: false,
          }
        : undefined,
      handlePayload: (shardId, packet) => {
        this.emit("dispatch", packet, shardId);
        this.dispatcher.dispatch(packet, shardId);
      },
    });

    this.websocket = manager;
    this.ws = manager;
    this.shards = manager.shards;

    manager.on(WebSocketManagerEvents.ShardReady, (id) => this.emit("shardReady", id));
    manager.on(WebSocketManagerEvents.ShardDisconnect, ({ shardId, code }) =>
      this.emit("shardDisconnect", { id: shardId, code }),
    );
    manager.on(WebSocketManagerEvents.ShardReconnecting, (id) =>
      this.emit("shardReconnecting", id),
    );
    manager.on(WebSocketManagerEvents.ShardError, (data) => {
      this.emit("shardError", data);
      if (this.listenerCount("error") > 0) {
        this.emit("error", data.error);
      }
    });
    manager.on(WebSocketManagerEvents.Debug, (message, id) => this.emit("debug", message, id));
    manager.on(WebSocketManagerEvents.Hello, (interval, id) => this.emit("hello", interval, id));
    manager.on(WebSocketManagerEvents.HeartbeatAck, (id) => this.emit("heartbeatACK", id));

    await manager.connect();
    return options_token(this.token);
  }

  /**
   * Disconnects every shard and clears the manager.
   */
  disconnect(): void {
    this.destroy().catch(() => undefined);
  }

  /**
   * Destroys every gateway shard and marks the client as disconnected.
   *
   * @returns A promise that resolves after all shards have closed.
   */
  async destroy(): Promise<void> {
    this.readyShards.clear();
    this.readyAt = undefined;
    await this.websocket?.destroy();
  }

  /**
   * The cached current user, when the client has received READY.
   */
  get user(): UserStructureInstance | null {
    return this.me ? (this.users.cache.get(this.me.id) ?? null) : null;
  }

  /**
   * Marks a shard as ready and returns whether every selected shard is ready.
   *
   * @param shardId - The shard that received READY.
   * @returns Whether the client can emit its single ready event.
   */
  public _markReady(shardId?: number): boolean {
    if (shardId === undefined) {
      return true;
    }
    this.readyShards.add(shardId);
    const expected =
      this.shardIds?.length ?? (typeof this.shardsCount === "number" ? this.shardsCount : 1);
    return this.readyShards.size >= expected;
  }

  get uptime(): number {
    if (!this.readyAt) {
      throw new Error("Client is not ready");
    }
    return Date.now() - this.readyAt.getTime();
  }

  /**
   * Whether every selected shard has completed its initial gateway handshake.
   */
  isReady(): boolean {
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
      status: this.presence.status as PresenceUpdateStatus,
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
   * Requests guild members through the shard that owns the guild.
   */
  async requestGuildMembers(data: GatewayRequestGuildMembersData): Promise<void> {
    await this.websocket?.requestGuildMembers(data);
  }

  /**
   * Requests ephemeral voice channel information for a guild.
   */
  async requestChannelInfo(data: GatewayRequestChannelInfoData): Promise<void> {
    await this.websocket?.requestChannelInfo(data);
  }

  /**
   * Sends a raw gateway payload through the appropriate shard.
   */
  async sendToShard(
    shardId: number,
    op: GatewayOpcodes,
    data: GatewaySendPayload["d"],
  ): Promise<void> {
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
   * Fetches the current application.
   *
   * @returns The official application payload, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/application#get-current-application
   */
  async fetchApplication(): Promise<RESTGetCurrentApplicationResult | null> {
    return (await this.rest.get(
      Routes.currentApplication(),
    )) as RESTGetCurrentApplicationResult | null;
  }

  /**
   * Fetches an application Activity instance.
   *
   * @param instanceId - The Activity instance ID.
   * @returns The official Activity instance, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/application#get-application-activity-instance
   */
  async fetchApplicationActivityInstance(
    instanceId: string,
  ): Promise<RESTGetAPIApplicationActivityInstanceResult | null> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return (await this.rest.get(
      Routes.applicationActivityInstance(this.me.id, instanceId),
    )) as RESTGetAPIApplicationActivityInstanceResult | null;
  }

  /**
   * Fetches the voice regions available to the current client.
   *
   * @returns The official voice-region payloads.
   * @see https://docs.discord.com/developers/resources/voice#list-voice-regions
   */
  async fetchVoiceRegions(): Promise<RESTGetAPIVoiceRegionsResult> {
    return (await this.rest.get(Routes.voiceRegions())) as RESTGetAPIVoiceRegionsResult;
  }

  /**
   * Edits the current application.
   *
   * @param data - The official current-application edit body.
   * @returns The edited application, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/application#edit-current-application
   */
  async editApplication(
    data: RESTPatchCurrentApplicationJSONBody,
  ): Promise<RESTPatchCurrentApplicationResult | null> {
    return (await this.rest.patch(Routes.currentApplication(), {
      body: data,
    })) as RESTPatchCurrentApplicationResult | null;
  }

  /**
   * Fetches application role-connection metadata records.
   *
   * @returns The official metadata records, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/application-role-connection-metadata#get-application-role-connection-metadata-records
   */
  async fetchApplicationRoleConnectionMetadata(): Promise<RESTGetAPIApplicationRoleConnectionMetadataResult | null> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return (await this.rest.get(
      Routes.applicationRoleConnectionMetadata(this.me.id),
    )) as RESTGetAPIApplicationRoleConnectionMetadataResult | null;
  }

  /**
   * Replaces application role-connection metadata records.
   *
   * @param data - The official metadata records.
   * @returns The updated metadata records, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/application-role-connection-metadata#update-application-role-connection-metadata-records
   */
  async setApplicationRoleConnectionMetadata(
    data: RESTPutAPIApplicationRoleConnectionMetadataJSONBody,
  ): Promise<RESTPutAPIApplicationRoleConnectionMetadataResult | null> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return (await this.rest.put(Routes.applicationRoleConnectionMetadata(this.me.id), {
      body: data,
    })) as RESTPutAPIApplicationRoleConnectionMetadataResult | null;
  }

  /**
   * Registers application commands globally
   * @param commands - Array of command data
   * @returns The registered commands
   * @link https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
   */
  async registerCommands(
    commands: RESTPutAPIApplicationCommandsJSONBody,
  ): Promise<RESTPutAPIApplicationCommandsResult> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.put(Routes.applicationCommands(this.me.id), {
      body: commands,
    }) as Promise<RESTPutAPIApplicationCommandsResult>;
  }

  /**
   * Registers application commands for a specific guild (faster for testing)
   * @param guildId - The guild ID
   * @param commands - Array of command data
   * @returns The registered commands
   * @link https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-guild-application-commands
   */
  async registerGuildCommands(
    guildId: string,
    commands: RESTPutAPIApplicationGuildCommandsJSONBody,
  ): Promise<RESTPutAPIApplicationGuildCommandsResult> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.put(Routes.applicationGuildCommands(this.me.id, guildId), {
      body: commands,
    }) as Promise<RESTPutAPIApplicationGuildCommandsResult>;
  }

  /**
   * Deletes all global application commands
   * @returns Empty array
   */
  async deleteAllCommands(): Promise<RESTPutAPIApplicationCommandsResult> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.put(Routes.applicationCommands(this.me.id), {
      body: [],
    }) as Promise<RESTPutAPIApplicationCommandsResult>;
  }

  /**
   * Deletes all application commands for a specific guild
   * @param guildId - The guild ID
   * @returns Empty array
   */
  async deleteAllGuildCommands(guildId: string): Promise<RESTPutAPIApplicationGuildCommandsResult> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.put(Routes.applicationGuildCommands(this.me.id, guildId), {
      body: [],
    }) as Promise<RESTPutAPIApplicationGuildCommandsResult>;
  }

  /**
   * Fetches all global application commands
   * @returns Array of commands
   */
  async fetchCommands(): Promise<RESTGetAPIApplicationCommandsResult> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.get(
      Routes.applicationCommands(this.me.id),
    ) as Promise<RESTGetAPIApplicationCommandsResult>;
  }

  /**
   * Fetches all application commands for a specific guild
   * @param guildId - The guild ID
   * @returns Array of commands
   */
  async fetchGuildCommands(guildId: string): Promise<RESTGetAPIApplicationGuildCommandsResult> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.get(
      Routes.applicationGuildCommands(this.me.id, guildId),
    ) as Promise<RESTGetAPIApplicationGuildCommandsResult>;
  }

  /**
   * Updates a specific global application command
   * @param commandId - The command ID
   * @param data - The updated command data
   * @returns The updated command
   */
  async updateCommand(
    commandId: string,
    data: RESTPatchAPIApplicationCommandJSONBody,
  ): Promise<RESTPatchAPIApplicationCommandResult> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.patch(Routes.applicationCommand(this.me.id, commandId), {
      body: data,
    }) as Promise<RESTPatchAPIApplicationCommandResult>;
  }

  /**
   * Updates a specific guild application command
   * @param guildId - The guild ID
   * @param commandId - The command ID
   * @param data - The updated command data
   * @returns The updated command
   */
  async updateGuildCommand(
    guildId: string,
    commandId: string,
    data: RESTPatchAPIApplicationGuildCommandJSONBody,
  ): Promise<RESTPatchAPIApplicationGuildCommandResult> {
    if (!this.me?.id) {
      throw new Error("Client is not logged in");
    }
    return this.rest.patch(Routes.applicationGuildCommand(this.me.id, guildId, commandId), {
      body: data,
    }) as Promise<RESTPatchAPIApplicationGuildCommandResult>;
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
