import EventEmitter from "node:events";
import {
  type GatewayDispatchPayload,
  GatewayOpcodes,
  type GatewayPresenceUpdateData,
  type GatewayRequestChannelInfoData,
  type GatewayRequestGuildMembersData,
  type GatewaySendPayload,
  type GatewayVoiceStateUpdateData,
} from "discord-api-types/v10";
import { DEFAULT_GATEWAY_URL } from "./constants";
import { ConnectQueue } from "./structures/ConnectQueue";
import { IdentifyThrottler } from "./throttling/IdentifyThrottler";
import type { IIdentifyThrottler } from "./throttling/IIdentifyThrottler";
import {
  type ShardDisconnectData,
  type ShardReconnectData,
  ShardSocketCloseCodes,
  type WebSocketManagerOptions,
} from "./types";
import { WebSocketShard, WebSocketShardEvents } from "./WebSocketShard";

/**
 * Events emitted by {@link WebSocketManager}.
 */
export enum WebSocketManagerEvents {
  ShardReady = "shardReady",
  ShardDisconnect = "shardDisconnect",
  ShardReconnecting = "shardReconnecting",
  ShardError = "shardError",
  ShardResumed = "shardResumed",
  Debug = "debug",
  Hello = "hello",
  HeartbeatAck = "heartbeatAck",
}

/**
 * Strongly-typed event signatures emitted by {@link WebSocketManager}.
 */
export interface WebSocketManagerEventsMap {
  [WebSocketManagerEvents.ShardReady]: [shardId: number];
  [WebSocketManagerEvents.ShardDisconnect]: [data: ShardDisconnectData];
  [WebSocketManagerEvents.ShardReconnecting]: [shardId: number];
  [WebSocketManagerEvents.ShardError]: [data: { id: number; error: Error }];
  [WebSocketManagerEvents.ShardResumed]: [shardId: number];
  [WebSocketManagerEvents.Debug]: [message: string, shardId?: number];
  [WebSocketManagerEvents.Hello]: [interval: number, shardId: number];
  [WebSocketManagerEvents.HeartbeatAck]: [shardId: number, latency: number];
}

/**
 * Coordinates a collection of {@link WebSocketShard} instances.
 *
 * @remarks
 * Spawns shards through a {@link ConnectQueue} that respects the gateway's
 * `max_concurrency`, shares an {@link IIdentifyThrottler} between them, and
 * forwards every received dispatch payload to the user-provided
 * `handlePayload` callback.
 *
 * @see {@link https://discord.com/developers/docs/topics/gateway#sharding}
 */
export class WebSocketManager extends EventEmitter<WebSocketManagerEventsMap> {
  /** Map of shard id to shard instance. */
  public readonly shards = new Map<number, WebSocketShard>();

  private readonly options: WebSocketManagerOptions;
  private readonly throttler: IIdentifyThrottler;
  private readonly connectQueue: ConnectQueue;

  /**
   * @param options - Manager configuration.
   * @param throttler - Optional identify throttler. Defaults to a local
   *   {@link IdentifyThrottler} sized by `max_concurrency`.
   */
  public constructor(options: WebSocketManagerOptions, throttler?: IIdentifyThrottler) {
    super();
    this.options = options;
    const maxConcurrency = options.gatewayInformation.session_start_limit.max_concurrency;
    this.throttler = throttler ?? new IdentifyThrottler(maxConcurrency);
    this.connectQueue = new ConnectQueue(5_500, maxConcurrency);
  }

  /**
   * Total number of shards as resolved against the gateway.
   */
  public get totalShards(): number {
    return this.options.shardCount === "auto"
      ? this.options.gatewayInformation.shards
      : this.options.shardCount;
  }

  /**
   * Average latency across every connected shard.
   */
  public get latency(): number {
    if (this.shards.size === 0) {
      return 0;
    }
    let total = 0;
    let count = 0;
    for (const shard of this.shards.values()) {
      if (shard.ping > 0) {
        total += shard.ping;
        count++;
      }
    }
    return count > 0 ? Math.round(total / count) : 0;
  }

  /**
   * Returns shard ids the manager is responsible for.
   */
  public getShardIds(): number[] {
    if (this.options.shardIds && this.options.shardIds.length > 0) {
      return [...this.options.shardIds];
    }
    return Array.from({ length: this.totalShards }, (_, index) => index);
  }

  /**
   * Spawns and connects every configured shard.
   */
  public async connect(): Promise<void> {
    const ids = this.getShardIds();
    this.debug(`Spawning ${ids.length} shard(s)`);

    const readyPromises: Promise<void>[] = [];
    for (const id of ids) {
      const shard = this.createShard(id);
      this.shards.set(id, shard);
      readyPromises.push(
        new Promise<void>((resolve, reject) => {
          const handleReady = () => {
            shard.off(WebSocketShardEvents.Error, handleError);
            shard.off(WebSocketShardEvents.SocketError, handleSocketError);
            resolve();
          };
          const handleError = (error: Error) => {
            shard.off(WebSocketShardEvents.Ready, handleReady);
            shard.off(WebSocketShardEvents.SocketError, handleSocketError);
            reject(error);
          };
          const handleSocketError = (error: Error) => {
            shard.off(WebSocketShardEvents.Ready, handleReady);
            shard.off(WebSocketShardEvents.Error, handleError);
            reject(error);
          };
          shard.once(WebSocketShardEvents.Ready, handleReady);
          shard.once(WebSocketShardEvents.Error, handleError);
          shard.once(WebSocketShardEvents.SocketError, handleSocketError);
          this.connectQueue.push(() => {
            shard.connect().catch(handleError);
          });
        }),
      );
    }

    try {
      await Promise.all(readyPromises);
    } catch (error) {
      this.connectQueue.clear();
      await this.destroy();
      throw error;
    }
  }

  /**
   * Destroys every shard and clears the manager.
   */
  public async destroy(code = ShardSocketCloseCodes.ShutdownAll): Promise<void> {
    this.connectQueue.clear();
    this.debug(`Destroying all shards with code ${code}`);
    await Promise.all(
      [...this.shards.values()].map((shard) => shard.destroy({ code, reason: "Manager destroy" })),
    );
    this.shards.clear();
  }

  /**
   * Sends a payload through a specific shard.
   */
  public async send(shardId: number, payload: GatewaySendPayload): Promise<void> {
    const shard = this.shards.get(shardId);
    if (!shard) {
      throw new Error(`Shard ${shardId} does not exist`);
    }
    await shard.send(payload);
  }

  /**
   * Broadcasts a presence update through every connected shard.
   */
  public async broadcastPresence(data: GatewayPresenceUpdateData): Promise<void> {
    await Promise.all(
      [...this.shards.values()].map((shard) => shard.updatePresence(data).catch(() => undefined)),
    );
  }

  /**
   * Updates a guild voice state through the shard owning that guild.
   */
  public async updateVoiceState(data: GatewayVoiceStateUpdateData): Promise<void> {
    const shardId = WebSocketManager.calculateShardId(data.guild_id, this.totalShards);
    const shard = this.shards.get(shardId);
    if (!shard) {
      throw new Error(`Shard ${shardId} does not exist`);
    }
    await shard.updateVoiceState(data);
  }

  /**
   * Requests guild members through the shard that owns the guild.
   */
  public async requestGuildMembers(data: GatewayRequestGuildMembersData): Promise<void> {
    const shardId = WebSocketManager.calculateShardId(data.guild_id, this.totalShards);
    await this.send(shardId, { op: GatewayOpcodes.RequestGuildMembers, d: data });
  }

  /**
   * Requests ephemeral voice channel information through the owning shard.
   */
  public async requestChannelInfo(data: GatewayRequestChannelInfoData): Promise<void> {
    const shardId = WebSocketManager.calculateShardId(data.guild_id, this.totalShards);
    await this.send(shardId, { op: GatewayOpcodes.RequestChannelInfo, d: data });
  }

  /**
   * Computes the shard id that owns the given guild id.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway#sharding-formula}
   */
  public static calculateShardId(guildId: string, totalShards: number): number {
    return Number((BigInt(guildId) >> 22n) % BigInt(totalShards));
  }

  private createShard(id: number): WebSocketShard {
    const shard = new WebSocketShard(id, this.throttler, {
      token: this.options.token,
      intents: this.options.intents,
      shardCount: this.totalShards,
      gatewayURL: this.options.gatewayInformation.url ?? DEFAULT_GATEWAY_URL,
      identifyProperties: this.options.identifyProperties,
      largeThreshold: this.options.largeThreshold,
      compress: this.options.compress,
      presence: this.options.presence,
      handlePayload: this.options.handlePayload,
      onShardDisconnect: (data) => this.onShardDisconnect(data),
      onShardReconnect: (data) => this.onShardReconnect(data),
    });

    shard.on(WebSocketShardEvents.Dispatch, (payload: GatewayDispatchPayload) => {
      this.options.handlePayload(id, payload);
    });

    shard.on(WebSocketShardEvents.Ready, () => {
      this.emit(WebSocketManagerEvents.ShardReady, id);
    });

    shard.on(WebSocketShardEvents.Resumed, () => {
      this.emit(WebSocketManagerEvents.ShardResumed, id);
    });

    shard.on(WebSocketShardEvents.Hello, (interval) => {
      this.emit(WebSocketManagerEvents.Hello, interval, id);
    });

    shard.on(WebSocketShardEvents.HeartbeatComplete, ({ latency }) => {
      this.emit(WebSocketManagerEvents.HeartbeatAck, id, latency);
    });

    shard.on(WebSocketShardEvents.Error, (error) => {
      this.emit(WebSocketManagerEvents.ShardError, { id, error });
    });

    shard.on(WebSocketShardEvents.SocketError, (error) => {
      this.emit(WebSocketManagerEvents.ShardError, { id, error });
    });

    shard.on(WebSocketShardEvents.Debug, (message) => {
      this.emit(WebSocketManagerEvents.Debug, message, id);
    });

    return shard;
  }

  private onShardDisconnect(data: ShardDisconnectData): void {
    this.emit(WebSocketManagerEvents.ShardDisconnect, data);
    this.options.onShardDisconnect?.(data);
  }

  private onShardReconnect(data: ShardReconnectData): void {
    this.emit(WebSocketManagerEvents.ShardReconnecting, data.shardId);
    this.options.onShardReconnect?.(data);
  }

  private debug(message: string): void {
    this.emit(WebSocketManagerEvents.Debug, message);
  }
}
