import type { APIGuildScheduledEvent } from "discord-api-types/v10";
import type Client from "../client";

class GuildScheduledEventStructure<T extends APIGuildScheduledEvent = APIGuildScheduledEvent> {
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

export default GuildScheduledEventStructure as new <
  T extends APIGuildScheduledEvent = APIGuildScheduledEvent,
>(
  data: T,
  client: Client,
) => GuildScheduledEventStructure<T> & T & { readonly client: Client };

export type GuildScheduledEventStructureInstance = GuildScheduledEventStructure &
  APIGuildScheduledEvent & { readonly client: Client };
