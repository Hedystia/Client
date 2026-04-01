import type { APIEntitlement } from "discord-api-types/v10";
import type Client from "../client";

class EntitlementStructure<T extends APIEntitlement = APIEntitlement> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
    this.client = client;
  }

  public get id(): string {
    return (this as unknown as APIEntitlement).id;
  }

  public get skuId(): string {
    return (this as unknown as APIEntitlement).sku_id;
  }

  public get userId(): string | null {
    return (this as unknown as APIEntitlement).user_id ?? null;
  }

  public get guildId(): string | null {
    return (this as unknown as APIEntitlement).guild_id ?? null;
  }

  public get startsAt(): string | null {
    return (this as unknown as APIEntitlement).starts_at ?? null;
  }

  public get endsAt(): string | null {
    return (this as unknown as APIEntitlement).ends_at ?? null;
  }

  public get consumed(): boolean {
    return (this as unknown as APIEntitlement).consumed ?? false;
  }
}

export default EntitlementStructure as new <T extends APIEntitlement = APIEntitlement>(
  data: T,
  client: Client,
) => EntitlementStructure<T> & T & { readonly client: Client };

export type EntitlementStructureInstance = EntitlementStructure &
  APIEntitlement & { readonly client: Client };
