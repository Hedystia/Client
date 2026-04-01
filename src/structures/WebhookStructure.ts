import type { APIWebhook } from "discord-api-types/v10";
import type Client from "../client";

class WebhookStructure<T extends APIWebhook = APIWebhook> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
    this.client = client;
  }

  public get id(): string {
    return (this as unknown as APIWebhook).id;
  }

  public get type(): number {
    return (this as unknown as APIWebhook).type;
  }

  public get guildId(): string | null {
    return (this as unknown as APIWebhook).guild_id ?? null;
  }

  public get channelId(): string | null {
    return (this as unknown as APIWebhook).channel_id ?? null;
  }

  public get name(): string | null {
    return (this as unknown as APIWebhook).name ?? null;
  }

  public get avatar(): string | null {
    return (this as unknown as APIWebhook).avatar ?? null;
  }

  public get token(): string | null {
    return (this as unknown as APIWebhook).token ?? null;
  }

  public get applicationId(): string | null {
    return (this as unknown as APIWebhook).application_id ?? null;
  }
}

export default WebhookStructure as new <T extends APIWebhook = APIWebhook>(
  data: T,
  client: Client,
) => WebhookStructure<T> & T & { readonly client: Client };

export type WebhookStructureInstance = WebhookStructure & APIWebhook & { readonly client: Client };
