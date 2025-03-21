import REST from "@/rest";
import { OpCodes, Status } from "@/utils/constants";
import WebSocketManager from "@/ws";
import ShardManager from "./ShardManager";
import EventEmitter from "node:events";
import Intents from "@/utils/intents";
import type { ClientEvents } from "@/types/ClientEvents";

export interface ClientOptions {
  token: string;
  intents: number | number[];
  presence?: {
    activities: unknown[];
    status: string;
    since: number | null;
    afk: boolean;
  };
  shards?: number | number[] | "auto";
  shardCount?: number;
}

export default class Client extends EventEmitter<ClientEvents> {
  token: string;
  intents: number;
  rest: REST;
  api: REST;
  presence: {
    activities: unknown[];
    status: string;
    since: number | null;
    afk: boolean;
  };
  ws: WebSocketManager;
  shardManager: ShardManager;
  readyAt!: Date;
  useSharding: boolean;

  constructor(options: ClientOptions) {
    super();
    this.token = `Bot ${options.token}`;
    if (Array.isArray(options.intents)) {
      this.intents = new Intents().convert(options.intents);
    } else {
      this.intents = options.intents;
    }
    this.rest = new REST({
      token: this.token,
      version: 10,
      restRequestTimeout: 10000,
    });
    this.api = this.rest;
    this.presence = {
      activities: [...(options.presence?.activities ?? [])],
      status: options.presence?.status ?? Status.Online,
      since: options.presence?.since ?? null,
      afk: options.presence?.afk ?? false,
    };

    this.ws = new WebSocketManager(this);

    this.useSharding = options.shards !== undefined;
    this.shardManager = new ShardManager(this, {
      autoShards: options.shards === "auto",
      shardCount: typeof options.shards === "number" ? options.shards : (options.shardCount ?? 1),
    });

    this.setupShardEvents();
  }

  login(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        if (this.useSharding) {
          this.shardManager.spawn().catch(reject);
          this.once("shardingReady", () => {
            this.readyAt = new Date();
            resolve(this.token);
          });
        } else {
          this.ws.connect();
          this.ws.once("ready", () => {
            this.readyAt = new Date();
            resolve(this.token);
          });
          this.ws.once("error", reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupShardEvents(): void {
    this.shardManager.on("shardReady", (id: number) => {
      this.emit("shardReady", id);
    });

    this.shardManager.on("shardDisconnect", (data: { id: number; code: number }) => {
      this.emit("shardDisconnect", data);
    });

    this.shardManager.on("shardReconnecting", (id: number) => {
      this.emit("shardReconnecting", id);
    });

    this.shardManager.on("shardError", (data: { id: number; error: Error }) => {
      this.emit("shardError", data);
    });

    this.shardManager.on("shardResume", (id: number) => {
      this.emit("shardResume", id);
    });
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

  setPresence(options: {
    activities: unknown[];
    status: string;
    since: number | null;
    afk: boolean;
  }): void {
    this.presence = {
      activities: [...options.activities],
      status: options.status,
      since: options.since,
      afk: options.afk,
    };

    const data = {
      op: OpCodes.Presence_Update,
      d: {
        activities: [...options.activities],
        status: options.status,
        afk: options.afk,
        since: options.since,
      },
    };

    if (this.useSharding) {
      this.shardManager.broadcastEval(data);
    } else {
      this.ws.send(data);
    }
  }

  getShard(id: number): WebSocketManager | undefined {
    return this.shardManager.shards.get(id);
  }

  broadcastEval(data: object): void {
    if (this.useSharding) {
      this.shardManager.broadcastEval(data);
    } else {
      this.ws.send(data);
    }
  }

  sendToShard(shardId: number, data: object): void {
    if (this.useSharding) {
      this.shardManager.sendToShard(shardId, data);
    } else if (shardId === 0) {
      this.ws.send(data);
    }
  }

  get totalShards(): number {
    return this.useSharding ? this.shardManager.shardCount : 1;
  }

  get connectedShards(): number {
    return this.useSharding ? this.shardManager.connectedShards : this.ws.isReady ? 1 : 0;
  }
}
