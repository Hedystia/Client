import process from "node:process";
import { GatewayOpcodes } from "discord-api-types/v10";
import type { IdentifyProperties, SendRateLimitState } from "./types";

/**
 * Gateway protocol version used by the client.
 *
 * @see {@link https://discord.com/developers/docs/topics/gateway#gateway-versioning}
 */
export const GATEWAY_VERSION = 10 as const;

/**
 * Default gateway URL used when no resume URL is available.
 */
export const DEFAULT_GATEWAY_URL = "wss://gateway.discord.gg" as const;

/**
 * Encoding used by the client when communicating with the gateway.
 */
export const GATEWAY_ENCODING = "json" as const;

/**
 * Maximum payload size the gateway accepts.
 */
export const MAX_PAYLOAD_SIZE = 4096 as const;

/**
 * Maximum number of payloads we send per minute, leaving a small safety margin
 * on top of Discord's 120-per-60s limit.
 */
export const SEND_RATE_LIMIT_MAX = 115 as const;

/**
 * Window size used for the send rate limit, in milliseconds.
 */
export const SEND_RATE_LIMIT_WINDOW = 60_000 as const;

/**
 * Default timeout (ms) used when waiting for a WebSocket handshake.
 */
export const DEFAULT_HANDSHAKE_TIMEOUT = 30_000 as const;

/**
 * Default timeout (ms) used when waiting for the HELLO frame.
 */
export const DEFAULT_HELLO_TIMEOUT = 60_000 as const;

/**
 * Default timeout (ms) used when waiting for the READY frame.
 */
export const DEFAULT_READY_TIMEOUT = 15_000 as const;

/**
 * Opcodes that bypass the standard send queue/rate limit window.
 *
 * @remarks
 * Heartbeats, identifies, and resumes must be deliverable even when the
 * shard's status is not yet {@link WebSocketShardStatus.Ready}.
 */
export const ImportantGatewayOpcodes = new Set<number>([
  GatewayOpcodes.Heartbeat,
  GatewayOpcodes.Identify,
  GatewayOpcodes.Resume,
]);

/**
 * Default identify connection properties.
 */
export const DefaultIdentifyProperties: IdentifyProperties = {
  os: process.platform,
  browser: "hedystia",
  device: "hedystia",
};

/**
 * Builds the initial state for the per-shard send rate limit.
 */
export function getInitialSendRateLimitState(): SendRateLimitState {
  return {
    sent: 0,
    resetAt: Date.now() + SEND_RATE_LIMIT_WINDOW,
  };
}
