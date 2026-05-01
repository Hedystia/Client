import type { APIGuildMember } from "discord-api-types/v10";
import type Client from "../client";
import type { MemberStructureInstance } from "../structures/MemberStructure";
import MemberStructure from "../structures/MemberStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class MemberManager {
  client: Client;
  private readonly _cache = new Cache<string, Cache<string, MemberStructureInstance>>();

  constructor(client: Client) {
    this.client = client;
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
        guildCache = new Cache<string, MemberStructureInstance>();
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
   * Gets the members cache
   * @link https://discord.com/developers/docs/resources/guild#guild-member-object
   * @returns {Cache<string, Cache<string, MemberStructureInstance>>} The members cache
   */
  public get cache(): Cache<string, Cache<string, MemberStructureInstance>> {
    return this._cache;
  }
}
