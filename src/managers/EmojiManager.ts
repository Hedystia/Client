import type { APIEmoji } from "discord-api-types/v10";
import type Client from "../client";
import type { GuildEmojiStructureInstance } from "../structures/GuildEmojiStructure";
import GuildEmojiStructure from "../structures/GuildEmojiStructure";
import Cache from "../utils/cache";

export default class EmojiManager {
  client: Client;
  private readonly _cache = new Cache<string, GuildEmojiStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Adds an emoji to the cache
   * @param {GuildEmojiStructureInstance} data The emoji data
   * @param {boolean} cache.enabled Whether to enable the emoji in the cache
   * @param {boolean} cache.force Whether to force add the emoji to the cache
   */
  public _add(
    data: GuildEmojiStructureInstance,
    cache: {
      enabled: boolean;
      force: boolean;
    },
  ): void {
    if (cache.enabled && data.id) {
      const emoji = this._cache.get(data.id);
      if (emoji && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  /**
   * Removes an emoji from the cache
   * @param {string} id The emoji's id
   */
  public _remove(id: string): void {
    this._cache.delete(id);
  }

  /**
   * Updates an emoji in the cache
   * @param {GuildEmojiStructureInstance} data The emoji data
   */
  public _update(data: GuildEmojiStructureInstance): void {
    this._add(data, { enabled: true, force: true });
  }

  /**
   * Gets an emoji from the cache by id
   * @param {string} id The emoji's id
   * @returns {GuildEmojiStructureInstance | undefined} The emoji or undefined
   */
  public get(id: string): GuildEmojiStructureInstance | undefined {
    return this._cache.get(id);
  }

  /**
   * Sets an emoji in the cache
   * @param {string} id The emoji's id
   * @param {GuildEmojiStructureInstance} data The emoji data
   */
  public set(id: string, data: GuildEmojiStructureInstance): void {
    this._cache.set(id, data);
  }

  /**
   * Fetches all emojis from a guild
   * @param {string} guildId The guild's id
   * @param {boolean} options.cache.force Whether to force fetch from the API even if cache is enabled
   * @returns {Promise<GuildEmojiStructureInstance[]>} The emojis
   */
  public async fetch(
    guildId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<GuildEmojiStructureInstance[]> {
    const cached: GuildEmojiStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const emoji of this._cache.values()) {
        if (emoji.guildId === guildId) {
          cached.push(emoji);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const emojis = (await this.client.rest.get(`/guilds/${guildId}/emojis`)) as APIEmoji[] | null;

    if (!emojis) {
      return cached;
    }

    return emojis.map((emoji) => {
      const emojiStructure = new GuildEmojiStructure(emoji, guildId, this.client);
      this._add(emojiStructure, { enabled: true, force: false });
      return emojiStructure;
    });
  }

  /**
   * Fetches a single emoji from a guild
   * @param {string} guildId The guild's id
   * @param {string} emojiId The emoji's id
   * @param {boolean} options.cache.force Whether to force fetch from the API even if cache is enabled
   * @returns {Promise<GuildEmojiStructureInstance | null>} The emoji or null
   */
  public async fetchOne(
    guildId: string,
    emojiId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<GuildEmojiStructureInstance | null> {
    const cached = this._cache.get(emojiId);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const emoji = (await this.client.rest.get(
      `/guilds/${guildId}/emojis/${emojiId}`,
    )) as APIEmoji | null;

    if (!emoji) {
      return null;
    }

    const emojiStructure = new GuildEmojiStructure(emoji, guildId, this.client);
    this._add(emojiStructure, { enabled: true, force: false });
    return emojiStructure;
  }

  /**
   * Gets the emojis cache
   * @returns {Cache<string, GuildEmojiStructureInstance>} The emojis cache
   */
  public get cache(): Cache<string, GuildEmojiStructureInstance> {
    return this._cache;
  }
}
