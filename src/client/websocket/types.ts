import type {
  APIGatewayBotInfo,
  GatewayDispatchPayload,
  GatewayIntentBits,
  GatewayPresenceUpdateData,
  GatewayReceivePayload,
  GatewaySendPayload,
} from "discord-api-types/v10";

/**
 * Identify properties sent in the IDENTIFY payload.
 *
 * @see {@link https://discord.com/developers/docs/topics/gateway-events#identify-identify-connection-properties}
 */
export interface IdentifyProperties {
  /** Operating system the shard runs on. */
  os: string;
  /** The "browser" name where the shard is running. */
  browser: string;
  /** The device on which the shard is running. */
  device: string;
}

/**
 * Persistent shard data used across reconnects/resumes.
 *
 * @see {@link https://discord.com/developers/docs/topics/gateway#resuming}
 */
export interface ShardData {
  /** Last received sequence number used for resuming. */
  sequence: number | null;
  /** Discord-provided URL used to resume the connection. */
  resumeGatewayURL: string | null;
  /** Unique session id assigned by Discord on READY. */
  sessionId: string | null;
}

/**
 * Heartbeat tracking state for a single shard.
 */
export interface ShardHeart {
  /** Heartbeat interval in milliseconds. */
  interval: number;
  /** Acknowledgement flag for the last heartbeat sent. */
  ack: boolean;
  /** Timestamp of the last heartbeat send. */
  lastBeat: number;
  /** Timestamp of the last heartbeat ack received. */
  lastAck: number;
  /** Active heartbeat interval timer. */
  intervalTimer: NodeJS.Timeout | null;
  /** Timer waiting for an ack. */
  ackTimeout: NodeJS.Timeout | null;
}

/**
 * Lifecycle status of a shard.
 */
export enum WebSocketShardStatus {
  /** Shard has not been started yet or has been destroyed. */
  Idle = 0,
  /** Shard is establishing the WebSocket connection. */
  Connecting = 1,
  /** Shard is sending the RESUME payload. */
  Resuming = 2,
  /** Shard is fully operational. */
  Ready = 3,
}

/**
 * Recovery action used when destroying a shard.
 */
export enum WebSocketShardDestroyRecovery {
  /** Reconnect with a brand new session. */
  Reconnect = 0,
  /** Resume the previous session. */
  Resume = 1,
}

/**
 * Custom shard close codes used internally.
 *
 * @see {@link https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-gateway-close-event-codes}
 */
export enum ShardSocketCloseCodes {
  /** Normal close. */
  Normal = 1000,
  /** Resuming an existing connection. */
  Resuming = 4200,
  /** Manual shutdown of a single shard. */
  Shutdown = 3000,
  /** Heartbeat ack timeout. */
  ZombiedConnection = 3010,
  /** Generic reconnect close. */
  Reconnect = 3020,
  /** Manual shutdown of every shard. */
  ShutdownAll = 3040,
  /** Connection-level timeout. */
  Timeout = 3050,
}

/**
 * Options used by {@link WebSocketShard.destroy}.
 */
export interface WebSocketShardDestroyOptions {
  /** Close code sent to the gateway. */
  code?: number;
  /** Optional human-readable reason. */
  reason?: string;
  /** Recovery action after destroying. */
  recover?: WebSocketShardDestroyRecovery;
}

/**
 * State of the per-shard send rate limit window.
 *
 * @remarks
 * Discord limits non-priority gateway sends to 120 per 60s. We keep a
 * conservative budget of 115 to leave headroom for heartbeats/identifies.
 */
export interface SendRateLimitState {
  /** Number of payloads sent in the current window. */
  sent: number;
  /** Timestamp at which the current window resets. */
  resetAt: number;
}

/**
 * Options used to construct a {@link WebSocketShard}.
 */
export interface WebSocketShardOptions {
  /** Bot token (without the `Bot ` prefix). */
  token: string;
  /** Combined intent bitfield. */
  intents: GatewayIntentBits | number;
  /** Total number of shards. */
  shardCount: number;
  /** Gateway base URL. */
  gatewayURL: string;
  /** Identify connection properties. */
  identifyProperties: IdentifyProperties;
  /** Maximum number of guild members to receive in GUILD_CREATE. */
  largeThreshold?: number;
  /** Whether identify-level compression is enabled. */
  compress?: boolean;
  /** Initial presence to send with IDENTIFY. */
  presence?: GatewayPresenceUpdateData;
  /** Time to wait for the HELLO frame in ms. */
  helloTimeout?: number;
  /** Time to wait for the READY frame in ms. */
  readyTimeout?: number;
  /** Time to wait for the WS handshake in ms. */
  handshakeTimeout?: number;
  /** Callback fired for every received dispatch payload. */
  handlePayload(shardId: number, packet: GatewayDispatchPayload): unknown;
  /** Callback fired when the shard fully disconnects. */
  onShardDisconnect?(data: ShardDisconnectData): void;
  /** Callback fired when the shard reconnects/resumes. */
  onShardReconnect?(data: ShardReconnectData): void;
}

/**
 * Payload passed to {@link WebSocketShardOptions.onShardDisconnect}.
 */
export interface ShardDisconnectData {
  shardId: number;
  code: number;
  reason: string;
}

/**
 * Payload passed to {@link WebSocketShardOptions.onShardReconnect}.
 */
export interface ShardReconnectData {
  shardId: number;
}

/**
 * Options used to construct a {@link WebSocketManager}.
 */
export interface WebSocketManagerOptions {
  /** Bot token (without the `Bot ` prefix). */
  token: string;
  /** Combined intent bitfield. */
  intents: GatewayIntentBits | number;
  /** Total number of shards or `"auto"` to fetch from the gateway. */
  shardCount: number | "auto";
  /** Specific shard ids to spawn (defaults to `[0..shardCount)`). */
  shardIds?: number[];
  /** Identify connection properties. */
  identifyProperties: IdentifyProperties;
  /** Bot information used to spawn shards. */
  gatewayInformation: APIGatewayBotInfo;
  /** Maximum number of guild members to receive in GUILD_CREATE. */
  largeThreshold?: number;
  /** Whether identify-level compression is enabled. */
  compress?: boolean;
  /** Initial presence to send with IDENTIFY. */
  presence?: GatewayPresenceUpdateData;
  /** Callback fired for every received dispatch payload. */
  handlePayload(shardId: number, packet: GatewayDispatchPayload): unknown;
  /** Callback fired when a shard fully disconnects. */
  onShardDisconnect?(data: ShardDisconnectData): void;
  /** Callback fired when a shard reconnects/resumes. */
  onShardReconnect?(data: ShardReconnectData): void;
}

/**
 * Re-exports of frequently used gateway payload types.
 */
export type {
  GatewayDispatchPayload,
  GatewayPresenceUpdateData,
  GatewayReceivePayload,
  GatewaySendPayload,
};
