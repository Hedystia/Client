import type { APIUser } from "discord-api-types/v10";
import type Client from "../client";
import type { ManagerCacheConfig } from "../client";
import type { UserStructureInstance } from "../structures/UserStructure";
import UserStructure from "../structures/UserStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class UserManager {
  client: Client;
  private readonly _cache: Cache<string, UserStructureInstance>;

  constructor(client: Client, cacheConfig?: ManagerCacheConfig) {
    this.client = client;
    this._cache = new Cache({
      enabled: cacheConfig?.enabled,
      maxSize: cacheConfig?.maxSize,
      ttl: cacheConfig?.ttl,
      dynamicTTL: cacheConfig?.dynamicTTL,
      cleanupInterval: cacheConfig?.cleanupInterval,
    });
  }

  /**
   * Adds a user to the cache
   * @param {UserStructureInstance} data The user data
   * @param {boolean} cache.enabled Whether to enable the user in the cache
   * @param {boolean} cache.force Whether to force add the user to the cache
   */
  public _add(
    data: UserStructureInstance,
    cache: {
      enabled: boolean;
      force: boolean;
    },
  ): void {
    if (cache.enabled) {
      const user = this.client.users.cache.get(data.id);
      if (user && !cache.force) {
        return;
      }
      this.client.users.cache.set(data.id, data);
    }
  }

  /**
   * Fetches a user from the API
   * @param {string} id The user's id
   * @param {boolean} options.cache.force Whether to force fetch the user from the API even if cache is enabled
   * @param {boolean} options.useStructure Whether to use the structure or the raw data
   * @link https://discord.com/developers/docs/resources/user#get-user
   * @returns {Promise<APIUser | UserStructureInstance | null>} The user data
   */
  public async fetch(
    id: string,
    options?: {
      cache?: {
        force: boolean;
      };
      useStructure?: boolean;
    },
  ): Promise<APIUser | UserStructureInstance | null> {
    const user = (await this.client.rest.get(Routes.user(id)).catch(() => null)) as APIUser | null;
    if (!user) {
      return null;
    }
    if (options?.useStructure !== false) {
      const userStructure = new UserStructure(user);
      this._add(userStructure, {
        enabled: true,
        force: options?.cache?.force ?? false,
      });
      return userStructure;
    }
    return user;
  }

  /**
   * Removes a user from the cache
   * @param {string} id The user's id
   */
  public _remove(id: string): void {
    this.client.users.cache.delete(id);
  }

  /**
   * Gets the users cache
   * @link https://discord.com/developers/docs/resources/user#user-object
   * @returns {Cache<string, UserStructureInstance>} The users cache
   */
  public get cache(): Cache<string, UserStructureInstance> {
    return this._cache;
  }
}
