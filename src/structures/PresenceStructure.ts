import type { GatewayPresenceUpdateDispatchData } from "discord-api-types/v10";
import { PresenceUpdateStatus } from "discord-api-types/v10";
import type Client from "../client";

class PresenceStructure<
  T extends GatewayPresenceUpdateDispatchData = GatewayPresenceUpdateDispatchData,
> {
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.guildId = guildId;
    this.client = client;
  }
}

export default PresenceStructure as new <
  T extends GatewayPresenceUpdateDispatchData = GatewayPresenceUpdateDispatchData,
>(
  data: T,
  guildId: string,
  client: Client,
) => PresenceStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type PresenceStructureInstance = PresenceStructure &
  GatewayPresenceUpdateDispatchData & { readonly guildId: string; readonly client: Client };
