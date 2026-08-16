import type {
  APISticker,
  RESTGetAPIStickerResult,
  RESTPatchAPIGuildStickerJSONBody,
  RESTPatchAPIGuildStickerResult,
  RESTPostAPIGuildStickerFormDataBody,
  RESTPostAPIGuildStickerResult,
} from "discord-api-types/v10";
import type Client from "../client";
import type { GuildStickerStructureInstance } from "../structures/GuildStickerStructure";
import GuildStickerStructure from "../structures/GuildStickerStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

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
   * Fetches a globally available sticker by ID.
   *
   * @param stickerId - The sticker ID.
   * @returns The official sticker payload, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/sticker#get-sticker
   */
  public async fetchGlobal(stickerId: string): Promise<RESTGetAPIStickerResult | null> {
    return (await this.client.rest.get(
      Routes.sticker(stickerId),
    )) as RESTGetAPIStickerResult | null;
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

    const stickers = (await this.client.rest.get(Routes.guildStickers(guildId))) as
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
      Routes.guildSticker(guildId, stickerId),
    )) as APISticker | null;

    if (!sticker) {
      return null;
    }

    const stickerStructure = new GuildStickerStructure(sticker, guildId, this.client);
    this._add(stickerStructure, { enabled: true, force: false });
    return stickerStructure;
  }

  /**
   * Creates a custom sticker in a guild.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord sticker form-data body.
   * @param reason - Optional audit-log reason.
   * @returns The created sticker, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/sticker#create-guild-sticker
   */
  public async create(
    guildId: string,
    data: RESTPostAPIGuildStickerFormDataBody,
    reason?: string,
  ): Promise<GuildStickerStructureInstance | null> {
    const form = new FormData();
    form.append("name", data.name);
    form.append("description", data.description);
    form.append("tags", data.tags);
    form.append("file", data.file as Blob | string);

    const sticker = (await this.client.rest.post(Routes.guildStickers(guildId), {
      body: form,
      reason,
    })) as RESTPostAPIGuildStickerResult | null;
    if (!sticker) {
      return null;
    }

    const structure = new GuildStickerStructure(sticker, guildId, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Edits a custom sticker in a guild.
   *
   * @param guildId - The guild ID.
   * @param stickerId - The sticker ID.
   * @param data - The official Discord sticker-edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited sticker, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/sticker#modify-guild-sticker
   */
  public async edit(
    guildId: string,
    stickerId: string,
    data: RESTPatchAPIGuildStickerJSONBody,
    reason?: string,
  ): Promise<GuildStickerStructureInstance | null> {
    const sticker = (await this.client.rest.patch(Routes.guildSticker(guildId, stickerId), {
      body: data,
      reason,
    })) as RESTPatchAPIGuildStickerResult | null;
    if (!sticker) {
      return null;
    }

    const structure = new GuildStickerStructure(sticker, guildId, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Deletes a custom sticker from a guild.
   *
   * @param guildId - The guild ID.
   * @param stickerId - The sticker ID.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/sticker#delete-guild-sticker
   */
  public async delete(guildId: string, stickerId: string, reason?: string): Promise<void> {
    await this.client.rest.delete(Routes.guildSticker(guildId, stickerId), { reason });
    this._remove(stickerId);
  }

  /**
   * Gets the stickers cache
   * @returns {Cache<string, GuildStickerStructureInstance>} The stickers cache
   */
  public get cache(): Cache<string, GuildStickerStructureInstance> {
    return this._cache;
  }
}
