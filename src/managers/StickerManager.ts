import type { APISticker } from "discord-api-types/v10";
import type Client from "../client";
import type { GuildStickerStructureInstance } from "../structures/GuildStickerStructure";
import GuildStickerStructure from "../structures/GuildStickerStructure";
import Cache from "../utils/cache";

export default class StickerManager {
  client: Client;
  private readonly _cache = new Cache<string, GuildStickerStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Adds a sticker to the cache
   * @param {GuildStickerStructureInstance} data The sticker data
   * @param {boolean} cache.enabled Whether to enable the sticker in the cache
   * @param {boolean} cache.force Whether to force add the sticker to the cache
   */
  public _add(
    data: GuildStickerStructureInstance,
    cache: {
      enabled: boolean;
      force: boolean;
    },
  ): void {
    if (cache.enabled && data.id) {
      const sticker = this._cache.get(data.id);
      if (sticker && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  /**
   * Removes a sticker from the cache
   * @param {string} id The sticker's id
   */
  public _remove(id: string): void {
    this._cache.delete(id);
  }

  /**
   * Updates a sticker in the cache
   * @param {GuildStickerStructureInstance} data The sticker data
   */
  public _update(data: GuildStickerStructureInstance): void {
    this._add(data, { enabled: true, force: true });
  }

  /**
   * Gets a sticker from the cache by id
   * @param {string} id The sticker's id
   * @returns {GuildStickerStructureInstance | undefined} The sticker or undefined
   */
  public get(id: string): GuildStickerStructureInstance | undefined {
    return this._cache.get(id);
  }

  /**
   * Sets a sticker in the cache
   * @param {string} id The sticker's id
   * @param {GuildStickerStructureInstance} data The sticker data
   */
  public set(id: string, data: GuildStickerStructureInstance): void {
    this._cache.set(id, data);
  }

  /**
   * Fetches all stickers from a guild
   * @param {string} guildId The guild's id
   * @param {boolean} options.cache.force Whether to force fetch from the API even if cache is enabled
   * @returns {Promise<GuildStickerStructureInstance[]>} The stickers
   */
  public async fetch(
    guildId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<GuildStickerStructureInstance[]> {
    const cached: GuildStickerStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const sticker of this._cache.values()) {
        if (sticker.guild_id === guildId) {
          cached.push(sticker);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const stickers = (await this.client.rest.get(`/guilds/${guildId}/stickers`)) as
      | APISticker[]
      | null;

    if (!stickers) {
      return cached;
    }

    return stickers.map((sticker) => {
      const stickerStructure = new GuildStickerStructure(sticker, guildId, this.client);
      this._add(stickerStructure, { enabled: true, force: false });
      return stickerStructure;
    });
  }

  /**
   * Fetches a single sticker from a guild
   * @param {string} guildId The guild's id
   * @param {string} stickerId The sticker's id
   * @param {boolean} options.cache.force Whether to force fetch from the API even if cache is enabled
   * @returns {Promise<GuildStickerStructureInstance | null>} The sticker or null
   */
  public async fetchOne(
    guildId: string,
    stickerId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<GuildStickerStructureInstance | null> {
    const cached = this._cache.get(stickerId);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const sticker = (await this.client.rest.get(
      `/guilds/${guildId}/stickers/${stickerId}`,
    )) as APISticker | null;

    if (!sticker) {
      return null;
    }

    const stickerStructure = new GuildStickerStructure(sticker, guildId, this.client);
    this._add(stickerStructure, { enabled: true, force: false });
    return stickerStructure;
  }

  /**
   * Gets the stickers cache
   * @returns {Cache<string, GuildStickerStructureInstance>} The stickers cache
   */
  public get cache(): Cache<string, GuildStickerStructureInstance> {
    return this._cache;
  }
}
