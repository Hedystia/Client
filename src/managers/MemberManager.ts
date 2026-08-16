import type {
  APIGuildMember,
  RESTGetAPIGuildMembersQuery,
  RESTGetAPIGuildMembersResult,
  RESTGetAPIGuildMembersSearchQuery,
  RESTGetAPIGuildMembersSearchResult,
  RESTPatchAPICurrentGuildMemberJSONBody,
  RESTPatchAPIGuildMemberJSONBody,
  RESTPostAPIGuildBulkBanJSONBody,
  RESTPutAPIGuildMemberJSONBody,
  Snowflake,
} from "discord-api-types/v10";

import type Client from "../client";
import type { ManagerCacheConfig } from "../client";

import type { MemberStructureInstance } from "../structures/MemberStructure";
import MemberStructure from "../structures/MemberStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";
import type { GuildBanCreateOptions, GuildBulkBanOptions } from "./GuildBanManager";

export default class MemberManager {
  client: Client;
  private readonly _cache = new Cache<string, Cache<string, MemberStructureInstance>>();
  private readonly cacheConfig?: ManagerCacheConfig;

  constructor(client: Client, cacheConfig?: ManagerCacheConfig) {
    this.client = client;
    this.cacheConfig = cacheConfig;
  }

  /**
   * Adds a member to the cache
   * @param {MemberStructureInstance} data The member data
   * @param {boolean} cache.enabled Whether to enable the member in the cache
   * @param {boolean} cache.force Whether to force add the member to the cache
   */
  public _add(
    data: MemberStructureInstance,
    cache: {
      enabled: boolean;
      force: boolean;
    },
  ): void {
    if (cache.enabled && data.user?.id && data.guildId) {
      let guildCache = this._cache.get(data.guildId);
      if (!guildCache) {
        guildCache = new Cache<string, MemberStructureInstance>(this.cacheConfig);
        this._cache.set(data.guildId, guildCache);
      }

      const member = guildCache.get(data.user.id);
      if (member && !cache.force) {
        return;
      }
      guildCache.set(data.user.id, data);
    }
  }

  /**
   * Removes a member from the cache
   * @param {string} guildId The guild's id
   * @param {string} [userId] The member's user id (if not provided, removes all members of the guild)
   */
  public _remove(guildId: string, userId?: string): void {
    if (userId) {
      const guildCache = this._cache.get(guildId);
      if (guildCache) {
        guildCache.delete(userId);
        if (guildCache.size === 0) {
          this._cache.delete(guildId);
        }
      }
    } else {
      this._cache.delete(guildId);
    }
  }

  /**
   * Updates a member in the cache
   * @param {MemberStructureInstance} data The member data
   */
  public _update(data: MemberStructureInstance): void {
    this._add(data, { enabled: true, force: true });
  }

  /**
   * Gets a guild's members cache
   * @param {string} guildId The guild's id
   * @returns {Cache<string, MemberStructureInstance> | undefined} The guild's member cache or undefined
   */
  public get(guildId: string): Cache<string, MemberStructureInstance> | undefined {
    return this._cache.get(guildId);
  }

  /**
   * Gets a specific member from the cache
   * @param {string} guildId The guild's id
   * @param {string} userId The member's user id
   * @returns {MemberStructureInstance | undefined} The member or undefined
   */
  public getMember(guildId: string, userId: string): MemberStructureInstance | undefined {
    const guildCache = this._cache.get(guildId);
    return guildCache?.get(userId);
  }

  /**
   * Sets a member in the cache
   * @param {string} guildId The guild's id
   * @param {string} userId The member's user id
   * @param {MemberStructureInstance} data The member data
   */
  public set(guildId: string, userId: string, data: MemberStructureInstance): void {
    let guildCache = this._cache.get(guildId);
    if (!guildCache) {
      guildCache = new Cache<string, MemberStructureInstance>();
      this._cache.set(guildId, guildCache);
    }
    guildCache.set(userId, data);
  }

  /**
   * Fetches a member from the API
   * @param {string} guildId The guild's id
   * @param {string} memberId The member's id
   * @param {boolean} options.cache.force Whether to force fetch the member from the API even if cache is enabled
   * @link https://discord.com/developers/docs/resources/guild#get-guild-member
   * @returns {Promise<MemberStructureInstance | null>} The member data
   */
  public async fetch(
    guildId: string,
    memberId: string,
    options?: {
      cache?: {
        force: boolean;
      };
    },
  ): Promise<MemberStructureInstance | null> {
    const guildCache = this._cache.get(guildId);
    const cached = guildCache?.get(memberId);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const member = (await this.client.rest
      .get(Routes.guildMember(guildId, memberId))
      .catch(() => null)) as APIGuildMember | null;
    if (!member) {
      return null;
    }
    const memberStructure = new MemberStructure(member, guildId, this.client);
    this._add(memberStructure, {
      enabled: true,
      force: options?.cache?.force ?? false,
    });
    return memberStructure;
  }

  /**
   * Fetches a page of guild members.
   *
   * @param guildId - The guild ID.
   * @param options - The official Discord member-list query fields.
   * @returns The fetched member structures.
   * @see https://docs.discord.com/developers/resources/guild#list-guild-members
   */
  public async fetchMany(
    guildId: string,
    options?: RESTGetAPIGuildMembersQuery,
  ): Promise<MemberStructureInstance[]> {
    const query = options
      ? Object.fromEntries(Object.entries(options).map(([key, value]) => [key, String(value)]))
      : undefined;
    const members = (await this.client.rest.get(Routes.guildMembers(guildId), {
      query,
    })) as RESTGetAPIGuildMembersResult;

    return members.map((member) => {
      const structure = new MemberStructure(
        member,
        guildId,
        this.client,
      ) as MemberStructureInstance;
      this._add(structure, { enabled: true, force: false });
      return structure;
    });
  }

  /**
   * Searches guild members by username or nickname.
   *
   * @param guildId - The guild ID.
   * @param options - The official Discord member-search query fields.
   * @returns The matching member structures.
   * @see https://docs.discord.com/developers/resources/guild#search-guild-members
   */
  public async search(
    guildId: string,
    options: RESTGetAPIGuildMembersSearchQuery,
  ): Promise<MemberStructureInstance[]> {
    const query = Object.fromEntries(
      Object.entries(options).map(([key, value]) => [key, String(value)]),
    );
    const members = (await this.client.rest.get(Routes.guildMembersSearch(guildId), {
      query,
    })) as RESTGetAPIGuildMembersSearchResult;

    return members.map((member) => {
      const structure = new MemberStructure(
        member,
        guildId,
        this.client,
      ) as MemberStructureInstance;
      this._add(structure, { enabled: true, force: false });
      return structure;
    });
  }

  /**
   * Adds an OAuth2 user to a guild.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID to add.
   * @param data - The official Discord add-member body.
   * @param reason - Optional audit-log reason.
   * @returns The added member, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#add-guild-member
   */
  public async add(
    guildId: string,
    userId: Snowflake,
    data: RESTPutAPIGuildMemberJSONBody,
    reason?: string,
  ): Promise<MemberStructureInstance | null> {
    const member = (await this.client.rest.put(Routes.guildMember(guildId, userId), {
      body: data,
      reason,
    })) as APIGuildMember | null;
    if (!member) {
      return null;
    }

    const structure = new MemberStructure(member, guildId, this.client) as MemberStructureInstance;
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Edits a guild member using the official Discord member-edit body.
   *
   * @param guildId - The guild ID.
   * @param userId - The member's user ID.
   * @param data - The official Discord member-edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited member, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-member
   */
  public async edit(
    guildId: string,
    userId: Snowflake,
    data: RESTPatchAPIGuildMemberJSONBody,
    reason?: string,
  ): Promise<MemberStructureInstance | null> {
    const member = (await this.client.rest.patch(Routes.guildMember(guildId, userId), {
      body: data,
      reason,
    })) as APIGuildMember | null;
    if (!member) {
      return null;
    }

    const structure = new MemberStructure(member, guildId, this.client) as MemberStructureInstance;
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Kicks a member from a guild.
   *
   * @param guildId - The guild ID.
   * @param userId - The member's user ID.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   */
  public async kick(guildId: string, userId: Snowflake, reason?: string): Promise<void> {
    await this.client.rest.delete(Routes.guildMember(guildId, userId), { reason });
    this._remove(guildId, userId);
  }

  /**
   * Bans a member from a guild.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID to ban.
   * @param options - Message deletion and audit-log options.
   * @returns A promise that resolves when Discord accepts the request.
   */
  public ban(guildId: string, userId: Snowflake, options?: GuildBanCreateOptions): Promise<void> {
    return this.client.bans.create(guildId, userId, options);
  }

  /**
   * Bans multiple users in one request.
   *
   * @param guildId - The guild ID.
   * @param userIds - User IDs to ban.
   * @param options - Message deletion and audit-log options.
   * @returns The successfully and unsuccessfully banned user IDs.
   * @see https://docs.discord.com/developers/resources/guild#bulk-guild-ban
   */
  public async bulkBan(
    guildId: string,
    userIds: RESTPostAPIGuildBulkBanJSONBody["user_ids"],
    options?: GuildBulkBanOptions,
  ) {
    return this.client.bans.bulkCreate(guildId, userIds, options);
  }

  /**
   * Updates the bot's member profile in a guild.
   * Supports the banner, avatar, and bio fields introduced by Discord in 2025.
   */
  public async updateCurrent(
    guildId: string,
    data: RESTPatchAPICurrentGuildMemberJSONBody,
  ): Promise<MemberStructureInstance | null> {
    const member = (await this.client.rest.patch(Routes.guildMember(guildId, "@me"), {
      body: data,
    })) as APIGuildMember | null;

    if (!member) {
      return null;
    }

    const memberStructure = new MemberStructure(member, guildId, this.client);
    this._add(memberStructure, { enabled: true, force: true });
    return memberStructure;
  }

  /**
   * Gets the members cache
   * @link https://discord.com/developers/docs/resources/guild#guild-member-object
   * @returns {Cache<string, Cache<string, MemberStructureInstance>>} The members cache
   */
  public get cache(): Cache<string, Cache<string, MemberStructureInstance>> {
    return this._cache;
  }
}
