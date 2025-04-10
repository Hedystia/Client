import REST from "@/rest";
import EventEmitter from "node:events";
import type Intents from "@/utils/intents";
import type { ClientEvents } from "@/types/ClientEvents";
import {
  PresenceUpdateStatus,
  type ActivityType,
  type APIGatewayBotInfo,
  type APIUser,
  type PresenceUpdateReceiveStatus,
} from "discord-api-types/v10";
import type { ClientOptions as WebSocketOptions } from "ws";
import ShardManager from "./ShardManager";
import { Routes } from "@/utils/constants";
import type { Presence } from "@/types/Gateway";
import GuildManager from "@/managers/GuildManager";

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
  cache?:
    | {
        guilds: boolean;
      }
    | boolean;
  cacheOptions?: {
    guilds?: {
      roles?: boolean;
      emojis?: boolean;
      stickers?: boolean;
      approximate_member_count?: boolean;
      approximate_presence_count?: boolean;
      application_id?: boolean;
    };
  };
}

interface Activities {
  name: string;
  type: ActivityType;
  url?: string;
  state?: string;
}

type KnownCacheKeys = "guilds";

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
  shards: Map<number, ShardManager>;
  cache:
    | {
        guilds: boolean;
      }
    | boolean;
  cacheOptions?: {
    guilds?: {
      roles?: boolean;
      emojis?: boolean;
      stickers?: boolean;
      approximate_member_count?: boolean;
      approximate_presence_count?: boolean;
      application_id?: boolean;
    };
  };

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

    this.cache = options?.cache ?? true;
    this.cacheOptions = options?.cacheOptions;
  }

  /**
   * Logs in to the gateway with rate limit handling
   * @link https://discord.com/developers/docs/topics/gateway#connecting
   */
  async login(): Promise<void> {
    const gatewayData = await this.getGatewayBot();
    this.shardsCount = this.shardsCount === "auto" ? gatewayData.shards : this.shardsCount;

    for (let i = 0; i < this.shardsCount; i++) this.shards.set(i, new ShardManager(i, this));

    await this.connectShards(0, this.shards.size - 1, gatewayData.sessionStartLimit);
  }

  /**
   * Connects shards while respecting Discord's session start limit
   * @param {number} startIndex The index of the first shard to connect
   * @param {number} endIndex The index of the last shard to connect
   * @param {Object} sessionStartLimit The session start limit data
   * @private
   */
  private async connectShards(
    startIndex: number,
    endIndex: number,
    sessionStartLimit: {
      total: number;
      remaining: number;
      resetAfter: number;
      maxConcurrency: number;
    },
  ): Promise<void> {
    if (startIndex > endIndex) return;

    const remaining = sessionStartLimit.remaining;
    const maxConcurrency = sessionStartLimit.maxConcurrency;

    const LOW_REMAINING_THRESHOLD = Math.max(5, maxConcurrency);

    if (remaining <= LOW_REMAINING_THRESHOLD && startIndex <= endIndex) {
      await new Promise((resolve) => setTimeout(resolve, sessionStartLimit.resetAfter));
      const newGatewayData = await this.getGatewayBot();
      return this.connectShards(startIndex, endIndex, newGatewayData.sessionStartLimit);
    }

    const connectCount = Math.min(
      maxConcurrency,
      remaining - LOW_REMAINING_THRESHOLD,
      endIndex - startIndex + 1,
    );

    const connectPromises = [];
    for (let i = 0; i < connectCount; i++) {
      const shardIndex = startIndex + i;
      if (shardIndex <= endIndex) {
        const shard = this.shards.get(shardIndex);
        if (shard) {
          connectPromises.push(shard.connect());
        }
      }
    }

    await Promise.all(connectPromises);

    if (startIndex + connectCount <= endIndex) {
      const updatedGatewayData = await this.getGatewayBot();
      return this.connectShards(
        startIndex + connectCount,
        endIndex,
        updatedGatewayData.sessionStartLimit,
      );
    }
  }

  disconnect(): void {
    for (const [_, shard] of this.shards) shard.disconnect();
  }

  get uptime(): number {
    if (!this.readyAt) throw new Error("Client is not ready");
    return Date.now() - this.readyAt.getTime();
  }

  get isReady(): boolean {
    return this.readyAt !== undefined;
  }

  get readyTimestamp(): number {
    if (!this.readyAt) throw new Error("Client is not ready");
    return this.readyAt.getTime();
  }

  /**
   * Updates the presence of the bot
   * @param {Partial<Pick<Presence, "activities" | "status">>} options The options to update the presence with
   * @link https://discord.com/developers/docs/topics/gateway#update-presence
   */
  updatePresence(options: Partial<Pick<Presence, "activities" | "status">>): void {
    for (const [_, shard] of this.shards) shard.updatePresence(options);
  }

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

  isCacheEnabled<K extends KnownCacheKeys>(key: K, override?: boolean): boolean {
    if (override !== undefined) return override;
    if (this.cache === false) return false;
    if (typeof this.cache === "object") return this.cache[key] ?? true;
    return this.cache;
  }

  /**
   * Gets the guilds manager
   * @returns {GuildManager} The guilds manager
   */
  get guilds(): GuildManager {
    return new GuildManager(this);
  }
}
