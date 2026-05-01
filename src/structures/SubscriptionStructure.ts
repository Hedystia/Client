import type { APISubscription } from "discord-api-types/v10";
import type Client from "../client";

class SubscriptionStructure<T extends APISubscription = APISubscription> {
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

export default SubscriptionStructure as new <T extends APISubscription = APISubscription>(
  data: T,
  client: Client,
) => SubscriptionStructure<T> & T & { readonly client: Client };

export type SubscriptionStructureInstance = SubscriptionStructure &
  APISubscription & { readonly client: Client };
