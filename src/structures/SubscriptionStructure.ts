import type { APISubscription } from "discord-api-types/v10";
import type Client from "../client";

class SubscriptionStructure<T extends APISubscription = APISubscription> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
    this.client = client;
  }

  public get id(): string {
    return (this as unknown as APISubscription).id;
  }

  public get userId(): string {
    return (this as unknown as APISubscription).user_id;
  }

  public get skuIds(): string[] {
    return (this as unknown as APISubscription).sku_ids;
  }
}

export default SubscriptionStructure as new <T extends APISubscription = APISubscription>(
  data: T,
  client: Client,
) => SubscriptionStructure<T> & T & { readonly client: Client };

export type SubscriptionStructureInstance = SubscriptionStructure &
  APISubscription & { readonly client: Client };
