import type { APIGuildMember } from "discord-api-types/v10";
import type Client from "../client";
import type { MemberStructureInstance } from "../structures/MemberStructure";
import MemberStructure from "../structures/MemberStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class MemberManager {
  client: Client;
  private readonly _cache = new Cache<string, MemberStructureInstance>();

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
    if (cache.enabled && data.user?.id) {
      const member = this._cache.get(data.user.id);
      if (member && !cache.force) {
        return;
      }
      this._cache.set(data.user.id, data);
    }
  }

  /**
   * Removes a member from the cache
   * @param {string} id The member's user id
   */
  public _remove(id: string): void {
    this._cache.delete(id);
  }

  /**
   * Updates a member in the cache
   * @param {MemberStructureInstance} data The member data
   */
  public _update(data: MemberStructureInstance): void {
    this._add(data, { enabled: true, force: true });
  }

  /**
   * Gets a member from the cache by user id
   * @param {string} id The member's user id
   * @returns {MemberStructureInstance | undefined} The member or undefined
   */
  public get(id: string): MemberStructureInstance | undefined {
    return this._cache.get(id);
  }

  /**
   * Sets a member in the cache
   * @param {string} id The member's user id
   * @param {MemberStructureInstance} data The member data
   */
  public set(id: string, data: MemberStructureInstance): void {
    this._cache.set(id, data);
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
    const cached = this._cache.get(memberId);
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
   * @returns {Cache<string, MemberStructureInstance>} The members cache
   */
  public get cache(): Cache<string, MemberStructureInstance> {
    return this._cache;
  }
}
