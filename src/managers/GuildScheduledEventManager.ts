import type {
  APIGuildScheduledEvent,
  RESTDeleteAPIGuildScheduledEventResult,
  RESTGetAPIGuildScheduledEventQuery,
  RESTGetAPIGuildScheduledEventsQuery,
  RESTGetAPIGuildScheduledEventUsersQuery,
  RESTGetAPIGuildScheduledEventUsersResult,
  RESTPatchAPIGuildScheduledEventJSONBody,
  RESTPostAPIGuildScheduledEventJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import type { GuildScheduledEventStructureInstance } from "../structures/GuildScheduledEventStructure";
import GuildScheduledEventStructure from "../structures/GuildScheduledEventStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class GuildScheduledEventManager {
  client: Client;
  private readonly _cache = new Cache<string, GuildScheduledEventStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(
    data: GuildScheduledEventStructureInstance,
    cache: { enabled: boolean; force: boolean },
  ): void {
    if (cache.enabled) {
      const event = this._cache.get(data.id);
      if (event && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  public _remove(id: string): void {
    this._cache.delete(id);
  }

  public get(id: string): GuildScheduledEventStructureInstance | undefined {
    return this._cache.get(id);
  }

  public set(id: string, data: GuildScheduledEventStructureInstance): void {
    this._cache.set(id, data);
  }

  public async fetch(
    guildId: string,
    options?: RESTGetAPIGuildScheduledEventsQuery & { cache?: { force: boolean } },
  ): Promise<GuildScheduledEventStructureInstance[]> {
    const cached: GuildScheduledEventStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const event of this._cache.values()) {
        if (event.guild_id === guildId) {
          cached.push(event);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const query =
      options?.with_user_count === undefined
        ? undefined
        : { with_user_count: String(options.with_user_count) };
    const events = (await this.client.rest.get(Routes.guildScheduledEvents(guildId), {
      query,
    })) as APIGuildScheduledEvent[] | null;

    if (!events) {
      return cached;
    }

    return events.map((event) => {
      const eventStructure = new GuildScheduledEventStructure(event, this.client);
      this._add(eventStructure, { enabled: true, force: false });
      return eventStructure;
    });
  }

  /**
   * Creates a scheduled event in a guild.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord scheduled-event creation body.
   * @param reason - Optional audit-log reason.
   * @returns The created event, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild-scheduled-event#create-guild-scheduled-event
   */
  public async create(
    guildId: string,
    data: RESTPostAPIGuildScheduledEventJSONBody,
    reason?: string,
  ): Promise<GuildScheduledEventStructureInstance | null> {
    const event = (await this.client.rest.post(Routes.guildScheduledEvents(guildId), {
      body: data,
      reason,
    })) as APIGuildScheduledEvent | null;
    if (!event) {
      return null;
    }
    const structure = new GuildScheduledEventStructure(event, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Fetches one scheduled event from a guild.
   *
   * @param guildId - The guild ID.
   * @param eventId - The scheduled-event ID.
   * @param withUserCount - Whether to include the subscriber count.
   * @returns The event, or null when it was not found.
   * @see https://docs.discord.com/developers/resources/guild-scheduled-event#get-guild-scheduled-event
   */
  public async fetchOne(
    guildId: string,
    eventId: string,
    withUserCount = false,
  ): Promise<GuildScheduledEventStructureInstance | null> {
    const query: RESTGetAPIGuildScheduledEventQuery = {
      with_user_count: withUserCount,
    };
    const event = (await this.client.rest.get(Routes.guildScheduledEvent(guildId, eventId), {
      query: { with_user_count: String(query.with_user_count) },
    })) as APIGuildScheduledEvent | null;
    if (!event) {
      return null;
    }
    const structure = new GuildScheduledEventStructure(event, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Edits a scheduled event.
   *
   * @param guildId - The guild ID.
   * @param eventId - The scheduled-event ID.
   * @param data - The official Discord scheduled-event edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited event, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild-scheduled-event#modify-guild-scheduled-event
   */
  public async edit(
    guildId: string,
    eventId: string,
    data: RESTPatchAPIGuildScheduledEventJSONBody,
    reason?: string,
  ): Promise<GuildScheduledEventStructureInstance | null> {
    const event = (await this.client.rest.patch(Routes.guildScheduledEvent(guildId, eventId), {
      body: data,
      reason,
    })) as APIGuildScheduledEvent | null;
    if (!event) {
      return null;
    }
    const structure = new GuildScheduledEventStructure(event, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Deletes a scheduled event.
   *
   * @param guildId - The guild ID.
   * @param eventId - The scheduled-event ID.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/guild-scheduled-event#delete-guild-scheduled-event
   */
  public async delete(
    guildId: string,
    eventId: string,
    reason?: string,
  ): Promise<RESTDeleteAPIGuildScheduledEventResult> {
    await this.client.rest.delete(Routes.guildScheduledEvent(guildId, eventId), { reason });
    this._remove(eventId);
  }

  /**
   * Fetches users subscribed to a scheduled event.
   *
   * @param guildId - The guild ID.
   * @param eventId - The scheduled-event ID.
   * @param query - The official Discord subscriber query fields.
   * @returns The official Discord scheduled-event subscriber payloads.
   * @see https://docs.discord.com/developers/resources/guild-scheduled-event#get-guild-scheduled-event-users
   */
  public async fetchSubscribers(
    guildId: string,
    eventId: string,
    query: RESTGetAPIGuildScheduledEventUsersQuery = {},
  ): Promise<RESTGetAPIGuildScheduledEventUsersResult> {
    const params = Object.fromEntries(
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return (await this.client.rest.get(Routes.guildScheduledEventUsers(guildId, eventId), {
      query: params,
    })) as RESTGetAPIGuildScheduledEventUsersResult;
  }

  /**
   * Gets the scheduled-event cache.
   *
   * @returns The scheduled-event cache.
   */
  public get cache(): Cache<string, GuildScheduledEventStructureInstance> {
    return this._cache;
  }
}
