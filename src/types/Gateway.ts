import type { ActivityType, PresenceUpdateReceiveStatus } from "discord-api-types/v10";
import type { default as GatewayIntents } from "../utils/intents";

interface GatewayActivity {
  name: string;
  type: ActivityType;
  url?: string;
  state?: string;
}

export interface Presence {
  activities?: GatewayActivity[];
  status?: PresenceUpdateReceiveStatus;
}

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
  presence?: Partial<Pick<Presence, "activities" | "status">>;
  intents: GatewayIntents;
}
