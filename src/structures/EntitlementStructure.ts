import type { APIEntitlement } from "discord-api-types/v10";
import type Client from "../client";

class EntitlementStructure<T extends APIEntitlement = APIEntitlement> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }
}

export default EntitlementStructure as new <T extends APIEntitlement = APIEntitlement>(
  data: T,
  client: Client,
) => EntitlementStructure<T> & T & { readonly client: Client };

export type EntitlementStructureInstance = EntitlementStructure &
  APIEntitlement & { readonly client: Client };
