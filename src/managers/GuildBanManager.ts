import type {
  APIBan,
  RESTGetAPIGuildBansQuery,
  RESTPostAPIGuildBulkBanJSONBody,
  RESTPostAPIGuildBulkBanResult,
  RESTPutAPIGuildBanJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import type { GuildBanStructureInstance } from "../structures/GuildBanStructure";
import GuildBanStructure from "../structures/GuildBanStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

/** Options accepted when creating one guild ban. */
export type GuildBanCreateOptions = RESTPutAPIGuildBanJSONBody & {
  /** Optional audit-log reason. */
  reason?: string;
};

/** Options accepted when creating multiple guild bans. */
export type GuildBulkBanOptions = Omit<RESTPostAPIGuildBulkBanJSONBody, "user_ids"> & {
  /** Optional audit-log reason. */
  reason?: string;
};

/**
 * Manages guild bans and exposes convenient moderation helpers.
 */
export default class GuildBanManager {
  public client: Client;
  private readonly _cache = new Cache<string, GuildBanStructureInstance>();

  /**
   * @param client - The client instance.
   */
  public constructor(client: Client) {
    this.client = client;
  }

  /**
   * Adds a ban to the local cache.
   * @param data - The ban structure to cache.
   * @param cache - Cache behavior.
   */
  public _add(data: GuildBanStructureInstance, cache: { enabled: boolean; force: boolean }): void {
    if (cache.enabled && data.userId) {
      const ban = this._cache.get(data.userId);
      if (ban && !cache.force) {
        return;
      }
      this._cache.set(data.userId, data);
    }
  }

  /**
   * Removes a ban from the local cache.
   * @param userId - The banned user's ID.
   */
  public _remove(userId: string): void {
    this._cache.delete(userId);
  }

  /**
   * Gets a cached ban by user ID.
   * @param userId - The banned user's ID.
   * @returns The cached ban, if present.
   */
  public get(userId: string): GuildBanStructureInstance | undefined {
    return this._cache.get(userId);
  }

  /**
   * Fetches guild bans from Discord.
   * @param guildId - The guild ID.
   * @param options - Official Discord pagination and cache options.
   * @returns The fetched ban structures.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-bans
   */
  public async fetch(
    guildId: string,
    options?: RESTGetAPIGuildBansQuery & { cache?: { force?: boolean } },
  ): Promise<GuildBanStructureInstance[]> {
    const query = options
      ? Object.fromEntries(
          Object.entries(options)
            .filter(([key, value]) => key !== "cache" && value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined;
    const bans = (await this.client.rest.get(Routes.guildBans(guildId), { query })) as
      | APIBan[]
      | null;
    if (!bans) {
      return [];
    }

    return bans.map((ban) => {
      const structure = new GuildBanStructure(ban, guildId, this.client);
      this._add(structure, { enabled: true, force: options?.cache?.force ?? false });
      return structure;
    });
  }

  /**
   * Fetches one guild ban from Discord.
   * @param guildId - The guild ID.
   * @param userId - The banned user's ID.
   * @param options - Cache options.
   * @returns The ban structure, or null if Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-ban
   */
  public async fetchOne(
    guildId: string,
    userId: string,
    options?: { cache?: { force?: boolean } },
  ): Promise<GuildBanStructureInstance | null> {
    const cached = this._cache.get(userId);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const ban = (await this.client.rest.get(Routes.guildBan(guildId, userId))) as APIBan | null;
    if (!ban) {
      return null;
    }

    const structure = new GuildBanStructure(ban, guildId, this.client);
    this._add(structure, { enabled: true, force: options?.cache?.force ?? false });
    return structure;
  }

  /**
   * Bans one user from a guild.
   * @param guildId - The guild ID.
   * @param userId - The user ID to ban.
   * @param options - Message deletion and audit-log options.
   * @returns A promise that resolves when Discord accepts the ban.
   * @see https://docs.discord.com/developers/resources/guild#create-guild-ban
   */
  public async create(
    guildId: string,
    userId: string,
    options?: GuildBanCreateOptions,
  ): Promise<void> {
    const { reason, ...body } = options ?? {};
    await this.client.rest.put(Routes.guildBan(guildId, userId), { body, reason });
  }

  /**
   * Bans multiple users in one request.
   * @param guildId - The guild ID.
   * @param userIds - User IDs to ban, up to Discord's documented limit.
   * @param options - Message deletion and audit-log options.
   * @returns The IDs that were banned and the IDs that failed.
   * @see https://docs.discord.com/developers/resources/guild#bulk-guild-ban
   */
  public async bulkCreate(
    guildId: string,
    userIds: RESTPostAPIGuildBulkBanJSONBody["user_ids"],
    options?: GuildBulkBanOptions,
  ): Promise<RESTPostAPIGuildBulkBanResult | null> {
    const { reason, ...body } = options ?? {};
    const payload: RESTPostAPIGuildBulkBanJSONBody = { ...body, user_ids: userIds };
    return this.client.rest.post(Routes.guildBulkBan(guildId), {
      body: payload,
      reason,
    }) as Promise<RESTPostAPIGuildBulkBanResult | null>;
  }

  /**
   * Removes a user ban from a guild.
   * @param guildId - The guild ID.
   * @param userId - The user ID to unban.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   */
  public async remove(guildId: string, userId: string, reason?: string): Promise<void> {
    await this.client.rest.delete(Routes.guildBan(guildId, userId), { reason });
    this._remove(userId);
  }

  /**
   * Gets all cached bans.
   * @returns The ban cache.
   */
  public get cache(): Cache<string, GuildBanStructureInstance> {
    return this._cache;
  }
}
