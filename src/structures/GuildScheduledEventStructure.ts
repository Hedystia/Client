import type {
  APIGuildScheduledEvent,
  RESTGetAPIGuildScheduledEventUsersQuery,
  RESTGetAPIGuildScheduledEventUsersResult,
  RESTPatchAPIGuildScheduledEventJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import { CDN, ImageFormat } from "../utils/constants";

class GuildScheduledEventStructure<T extends APIGuildScheduledEvent = APIGuildScheduledEvent> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }

  /**
   * The scheduled event cover image URL.
   *
   * @param options - Image formatting options.
   * @returns The cover image URL, or null when the event has no image.
   */
  public imageURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp";
  }): string | null {
    const event = this as unknown as APIGuildScheduledEvent;
    if (!event.image) {
      return null;
    }
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.guildScheduledEventCover(event.id, event.image, extension as Parameters<typeof CDN.guildScheduledEventCover>[2])}?size=${options?.size ?? 1024}`;
  }

  /**
   * Edits this scheduled event.
   *
   * @param data - The official Discord scheduled-event edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited event, or null when Discord returned no data.
   */
  public edit(
    data: RESTPatchAPIGuildScheduledEventJSONBody,
    reason?: string,
  ): Promise<GuildScheduledEventStructureInstance | null> {
    const event = this as unknown as APIGuildScheduledEvent;
    return this.client.scheduledEvents.edit(event.guild_id, event.id, data, reason);
  }

  /**
   * Deletes this scheduled event.
   *
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   */
  public delete(reason?: string): Promise<void> {
    const event = this as unknown as APIGuildScheduledEvent;
    return this.client.scheduledEvents.delete(event.guild_id, event.id, reason);
  }

  /**
   * Fetches users subscribed to this scheduled event.
   *
   * @param query - The official Discord subscriber query fields.
   * @returns The official Discord subscriber payloads.
   */
  public fetchSubscribers(
    query?: RESTGetAPIGuildScheduledEventUsersQuery,
  ): Promise<RESTGetAPIGuildScheduledEventUsersResult> {
    const event = this as unknown as APIGuildScheduledEvent;
    return this.client.scheduledEvents.fetchSubscribers(event.guild_id, event.id, query);
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
