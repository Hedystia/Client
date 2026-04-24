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

  public get id(): string {
    return (this as unknown as APIGuildScheduledEvent).id;
  }

  public get guildId(): string {
    return (this as unknown as APIGuildScheduledEvent).guild_id;
  }

  public get name(): string {
    return (this as unknown as APIGuildScheduledEvent).name;
  }

  public get description(): string | null {
    return (this as unknown as APIGuildScheduledEvent).description ?? null;
  }

  public get channelId(): string | null {
    return (this as unknown as APIGuildScheduledEvent).channel_id ?? null;
  }

  public get creatorId(): string | null {
    return (this as unknown as APIGuildScheduledEvent).creator_id ?? null;
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
