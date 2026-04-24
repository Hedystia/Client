import type { APIRole } from "discord-api-types/v10";
import type Client from "../client";
import type { RoleStructureInstance } from "../structures/RoleStructure";
import RoleStructure from "../structures/RoleStructure";
import Cache from "../utils/cache";

export default class RoleManager {
  client: Client;
  private readonly _cache = new Cache<string, RoleStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Adds a role to the cache
   * @param {RoleStructureInstance} data The role data
   * @param {boolean} cache.enabled Whether to enable the role in the cache
   * @param {boolean} cache.force Whether to force add the role to the cache
   */
  public _add(
    data: RoleStructureInstance,
    cache: {
      enabled: boolean;
      force: boolean;
    },
  ): void {
    if (cache.enabled) {
      const role = this._cache.get(data.id);
      if (role && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  /**
   * Removes a role from the cache
   * @param {string} id The role's id
   */
  public _remove(id: string): void {
    this._cache.delete(id);
  }

  /**
   * Updates a role in the cache
   * @param {RoleStructureInstance} data The role data
   */
  public _update(data: RoleStructureInstance): void {
    this._add(data, { enabled: true, force: true });
  }

  /**
   * Gets a role from the cache by id
   * @param {string} id The role's id
   * @returns {RoleStructureInstance | undefined} The role or undefined
   */
  public get(id: string): RoleStructureInstance | undefined {
    return this._cache.get(id);
  }

  /**
   * Sets a role in the cache
   * @param {string} id The role's id
   * @param {RoleStructureInstance} data The role data
   */
  public set(id: string, data: RoleStructureInstance): void {
    this._cache.set(id, data);
  }

  /**
   * Fetches a role from the API
   * @param {string} guildId The guild's id
   * @param {string} roleId The role's id
   * @param {boolean} options.cache.force Whether to force fetch the role from the API even if cache is enabled
   * @link https://discord.com/developers/docs/resources/role#get-guild-role
   * @returns {Promise<RoleStructureInstance | null>} The role data
   */
  public async fetch(
    guildId: string,
    roleId: string,
    options?: {
      cache?: {
        force: boolean;
      };
    },
  ): Promise<RoleStructureInstance | null> {
    const cached = this._cache.get(roleId);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const role = (await this.client.rest
      .get(`/guilds/${guildId}/roles/${roleId}`)
      .catch(() => null)) as APIRole | null;
    if (!role) {
      return null;
    }
    const roleStructure = new RoleStructure(role, guildId, this.client);
    this._add(roleStructure, {
      enabled: true,
      force: options?.cache?.force ?? false,
    });
    return roleStructure;
  }

  /**
   * Gets the roles cache
   * @link https://discord.com/developers/docs/resources/role#role-object
   * @returns {Cache<string, RoleStructureInstance>} The roles cache
   */
  public get cache(): Cache<string, RoleStructureInstance> {
    return this._cache;
  }
}
