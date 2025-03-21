import type Client from "@/client";

// Events
import Ready from "@/events/ready";
import InteractionCreate from "@/events/interactionCreate";

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

        if ([1000, 4004, 4010, 4011, 4012, 4013, 4014].includes(code)) {
          return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
          setTimeout(() => this.connect(), delay);
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
        setTimeout(() => {
          this.send({ op: 1, d: this.sequence || null });
          this.lastHeartbeat = Date.now();
          this.interval = setInterval(() => {
            if (
              this.lastHeartbeat &&
              this.lastHeartbeatAck &&
              this.lastHeartbeatAck < this.lastHeartbeat
            ) {
              this.connection.close(1001);
            } else {
              this.send({ op: 1, d: this.sequence || null });
              this.ping = this.lastHeartbeatAck - this.lastHeartbeat;
              this.lastHeartbeat = Date.now();
            }
          }, d.d.heartbeat_interval);
        }, d.d.heartbeat_interval * Math.random());
        break;

      case OpCodes.Heartbeat_Ack:
        this.lastHeartbeatAck = Date.now();
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
          }

          switch (event) {
            // READY
            case GatewayDispatchEvents.Ready:
              return new Ready(this.client, d);

            // INTERACTION
            case GatewayDispatchEvents.InteractionCreate:
              return new InteractionCreate(this.client, d);
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
    this.emit("resume");
  }

  send(data: object): void {
    if (this.connected && this.connection.readyState === ws.OPEN) {
      this.connection.send(JSON.stringify(data));
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
