import type {
  GatewayActivityUpdateData,
  GatewayPresenceUpdateData,
  PresenceUpdateReceiveStatus,
} from "discord-api-types/v10";
import type { default as GatewayIntents } from "../utils/intents";

/**
 * The presence fields that can be changed by a client convenience method.
 * The field definitions come directly from discord-api-types/v10.
 */
export type Presence = Omit<Pick<GatewayPresenceUpdateData, "activities" | "status">, "status"> & {
  status: PresenceUpdateReceiveStatus;
};

/**
 * The official gateway identify payload used by this client.
 */
export interface Identify {
  token: string;
  properties: {
    os: string;
    browser: string;
    device: string;
  };
  compress?: boolean;
  largeThreshold?: number;
  shard?: [number, number];
  presence?: Partial<Presence>;
  intents: GatewayIntents;
}

export type { GatewayActivityUpdateData, PresenceUpdateReceiveStatus };
