import type { APIGuildScheduledEvent } from "discord-api-types/v10";
import type Client from "../client";
import type { GuildScheduledEventStructureInstance } from "../structures/GuildScheduledEventStructure";
import GuildScheduledEventStructure from "../structures/GuildScheduledEventStructure";
import Cache from "../utils/cache";

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
    options?: { cache?: { force: boolean }; withUserCount?: boolean },
  ): Promise<GuildScheduledEventStructureInstance[]> {
    const cached: GuildScheduledEventStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const event of this._cache.values()) {
        if (event.guildId === guildId) {
          cached.push(event);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const query = new URLSearchParams();
    if (options?.withUserCount) {
      query.set("with_user_count", "true");
    }

    const events = (await this.client.rest.get(
      `/guilds/${guildId}/scheduled-events?${query.toString()}`,
    )) as APIGuildScheduledEvent[] | null;

    if (!events) {
      return cached;
    }

    return events.map((event) => {
      const eventStructure = new GuildScheduledEventStructure(event, this.client);
      this._add(eventStructure, { enabled: true, force: false });
      return eventStructure;
    });
  }

  public get cache(): Cache<string, GuildScheduledEventStructureInstance> {
    return this._cache;
  }
}
