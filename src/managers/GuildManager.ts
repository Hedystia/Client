import type { APIGuild } from "discord-api-types/v10";
import type Client from "../client";
import type { GuildStructureInstance } from "../structures/GuildStructure";
import GuildStructure from "../structures/GuildStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class GuildManager {
  client: Client;
  private readonly _cache = new Cache<string, GuildStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Adds a guild to the cache
   * @param {GuildStructureInstance} data The guild data
   * @param {boolean} cache.enabled Whether to enable the guild in the cache
   * @param {boolean} cache.force Whether to force add the guild to the cache
   */
  public _add(
    data: GuildStructureInstance,
    cache: {
      enabled: boolean;
      force: boolean;
    },
  ): void {
    if (cache.enabled) {
      const guild = this.client.guilds.cache.get(data.id);
      if (guild && !cache.force) {
        return;
      }
      this.client.guilds.cache.set(data.id, data);
    }
  }

  /**
   * Fetches a guild from the API
   * @param {string} id The guild's id
   * @param {boolean} options.cache.force Whether to force fetch the guild from the API even if cache is enabled
   * @link https://discord.com/developers/docs/resources/guild#guild-object
   * @returns {Promise<GuildStructureInstance | null>} The guild data
   */
  public async fetch(
    id: string,
    options?: {
      cache?: {
        force: boolean;
      };
    },
  ): Promise<GuildStructureInstance | null> {
    const guild = (await this.client.rest
      .get(Routes.guild(id))
      .catch(() => null)) as APIGuild | null;
    if (!guild) {
      return null;
    }
    const guildStructure = new GuildStructure(guild, this.client);
    this._add(guildStructure, {
      enabled: true,
      force: options?.cache?.force ?? false,
    });
    return guildStructure;
  }

  /**
   * Removes a guild from the cache
   * @param {string} id The guild's id
   */
  public _remove(id: string): void {
    this.client.guilds.cache.delete(id);
  }

  /**
   * Gets the guilds cache
   * @link https://discord.com/developers/docs/resources/guild#guild-object
   * @returns {Cache<string, GuildStructureInstance>} The guilds cache
   */
  public get cache(): Cache<string, GuildStructureInstance> {
    return this._cache;
  }
}
