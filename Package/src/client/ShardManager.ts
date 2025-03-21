import type Client from "@/client";
import WebSocketManager from "@/ws";
import { EventEmitter } from "node:events";

export interface ShardManagerOptions {
  shardCount?: number;
  autoShards?: boolean;
}

export default class ShardManager extends EventEmitter {
  client: Client;
  shards: Map<number, WebSocketManager> = new Map();
  shardCount: number;
  autoShards: boolean;
  readyShards: Set<number> = new Set();

  constructor(client: Client, options: ShardManagerOptions = {}) {
    super();
    this.client = client;
    this.autoShards = options.autoShards ?? false;
    this.shardCount = options.shardCount ?? 1;
  }

  async spawn(): Promise<void> {
    if (this.autoShards) {
      await this.fetchRecommendedShards();
    }

    for (let i = 0; i < this.shardCount; i++) {
      await this.createShard(i);
      if (i < this.shardCount - 1) await this.wait(5000);
    }
  }

  async createShard(id: number): Promise<WebSocketManager> {
    const shard = new WebSocketManager(this.client, id, this.shardCount);
    this.shards.set(id, shard);

    shard.on("ready", () => {
      this.readyShards.add(id);
      this.client.emit("shardReady", id);

      if (this.readyShards.size === this.shardCount) {
        this.client.emit("shardingReady");
      }
    });

    shard.on("close", (code: number) => {
      this.readyShards.delete(id);
      this.client.emit("shardDisconnect", { id, code });
      if (code !== 1000) {
        this.client.emit("shardReconnecting", id);
        setTimeout(() => this.reconnectShard(id), 5000);
      }
    });

    shard.on("error", (error: Error) => {
      this.client.emit("shardError", { id, error });
    });

    shard.on("resume", () => {
      this.readyShards.add(id);
      this.client.emit("shardResume", id);
    });

    try {
      await shard.connect();
    } catch (error) {
      this.client.emit("shardError", {
        id,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }

    return shard;
  }

  async reconnectShard(id: number): Promise<void> {
    try {
      const shard = this.shards.get(id);
      if (!shard) {
        await this.createShard(id);
        return;
      }
      await shard.connect();
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error(String(error));
      this.client.emit("shardError", { id, error: typedError });
      setTimeout(() => this.reconnectShard(id), 15000);
    }
  }

  async fetchRecommendedShards(): Promise<void> {
    try {
      const data = await this.client.rest.get<{ shards: number }>("/gateway/bot");
      if (data?.shards) {
        this.shardCount = data.shards;
      }
    } catch (error) {
      throw new Error(`Failed to fetch recommended shards: ${error}`);
    }
  }

  broadcastEval(data: object): void {
    for (const [, shard] of this.shards) {
      shard.send(data);
    }
  }

  sendToShard(shardId: number, data: object): void {
    const shard = this.shards.get(shardId);
    if (shard) {
      shard.send(data);
    }
  }

  get connectedShards(): number {
    return this.readyShards.size;
  }

  get allShardsReady(): boolean {
    return this.readyShards.size === this.shardCount;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
