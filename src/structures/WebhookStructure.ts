import type { APIWebhook } from "discord-api-types/v10";
import type Client from "../client";

class WebhookStructure<T extends APIWebhook = APIWebhook> {
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

export default WebhookStructure as new <T extends APIWebhook = APIWebhook>(
  data: T,
  client: Client,
) => WebhookStructure<T> & T & { readonly client: Client };

export type WebhookStructureInstance = WebhookStructure & APIWebhook & { readonly client: Client };
