import type {
  APIRole,
  RESTGetAPIGuildRoleMemberCountsResult,
  RESTGetAPIGuildRolesResult,
  RESTPatchAPIGuildRoleJSONBody,
  RESTPatchAPIGuildRolePositionsJSONBody,
  RESTPostAPIGuildRoleJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import type { RoleStructureInstance } from "../structures/RoleStructure";
import RoleStructure from "../structures/RoleStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

/**
 * Options used when fetching a cached role.
 */
export interface RoleFetchOptions {
  /** Whether to ignore the cached role and request fresh data. */
  cache?: {
    force?: boolean;
  };
}

/**
 * Manages guild roles and exposes convenient role operations.
 */
export default class RoleManager {
  public client: Client;
  private readonly _cache = new Cache<string, RoleStructureInstance>();

  /**
   * Creates a role manager.
   *
   * @param client - The client instance.
   */
  public constructor(client: Client) {
    this.client = client;
  }

  /**
   * Adds a role to the cache.
   *
   * @param data - The role data.
   * @param cache - Cache behavior.
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
   * Removes a role from the cache.
   *
   * @param id - The role ID.
   */
  public _remove(id: string): void {
    this._cache.delete(id);
  }

  /**
   * Removes every cached role belonging to a guild.
   * @param guildId - The guild ID.
   */
  public _removeGuild(guildId: string): void {
    for (const [roleId, role] of this._cache.entries()) {
      if (role.guild_id === guildId) {
        this._cache.delete(roleId);
      }
    }
  }

  /**
   * Updates a role in the cache.
   *
   * @param data - The role data.
   */
  public _update(data: RoleStructureInstance): void {
    this._add(data, { enabled: true, force: true });
  }

  /**
   * Gets a role from the cache by ID.
   *
   * @param id - The role ID.
   * @returns The cached role, if present.
   */
  public get(id: string): RoleStructureInstance | undefined {
    return this._cache.get(id);
  }

  /**
   * Sets a role in the cache.
   *
   * @param id - The role ID.
   * @param data - The role structure.
   */
  public set(id: string, data: RoleStructureInstance): void {
    this._cache.set(id, data);
  }

  /**
   * Fetches one role from Discord.
   *
   * @param guildId - The guild ID.
   * @param roleId - The role ID.
   * @param options - Cache options.
   * @returns The role, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-role
   */
  public async fetch(
    guildId: string,
    roleId: string,
    options?: RoleFetchOptions,
  ): Promise<RoleStructureInstance | null> {
    const cached = this._cache.get(roleId);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const role = (await this.client.rest
      .get(Routes.guildRole(guildId, roleId))
      .catch(() => null)) as APIRole | null;
    if (!role) {
      return null;
    }

    const structure = new RoleStructure(role, guildId, this.client) as RoleStructureInstance;
    this._add(structure, {
      enabled: true,
      force: options?.cache?.force ?? false,
    });
    return structure;
  }

  /**
   * Fetches every role in a guild.
   *
   * @param guildId - The guild ID.
   * @param options - Cache options.
   * @returns The guild roles.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-roles
   */
  public async fetchAll(
    guildId: string,
    options?: RoleFetchOptions,
  ): Promise<RoleStructureInstance[]> {
    const roles = (await this.client.rest.get(
      Routes.guildRoles(guildId),
    )) as RESTGetAPIGuildRolesResult;
    return roles.map((role) => {
      const structure = new RoleStructure(role, guildId, this.client) as RoleStructureInstance;
      this._add(structure, {
        enabled: true,
        force: options?.cache?.force ?? false,
      });
      return structure;
    });
  }

  /**
   * Creates a role in a guild.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord role creation body.
   * @param reason - Optional audit-log reason.
   * @returns The created role, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#create-guild-role
   */
  public async create(
    guildId: string,
    data: RESTPostAPIGuildRoleJSONBody,
    reason?: string,
  ): Promise<RoleStructureInstance | null> {
    const role = (await this.client.rest.post(Routes.guildRoles(guildId), {
      body: data,
      reason,
    })) as APIRole | null;
    if (!role) {
      return null;
    }

    const structure = new RoleStructure(role, guildId, this.client) as RoleStructureInstance;
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Edits a role in a guild.
   *
   * @param guildId - The guild ID.
   * @param roleId - The role ID.
   * @param data - The official Discord role edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited role, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-role
   */
  public async edit(
    guildId: string,
    roleId: string,
    data: RESTPatchAPIGuildRoleJSONBody,
    reason?: string,
  ): Promise<RoleStructureInstance | null> {
    const role = (await this.client.rest.patch(Routes.guildRole(guildId, roleId), {
      body: data,
      reason,
    })) as APIRole | null;
    if (!role) {
      return null;
    }

    const structure = new RoleStructure(role, guildId, this.client) as RoleStructureInstance;
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Deletes a role from a guild.
   *
   * @param guildId - The guild ID.
   * @param roleId - The role ID.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/guild#delete-guild-role
   */
  public async delete(guildId: string, roleId: string, reason?: string): Promise<void> {
    await this.client.rest.delete(Routes.guildRole(guildId, roleId), { reason });
    this._remove(roleId);
  }

  /**
   * Changes role positions in a guild.
   *
   * @param guildId - The guild ID.
   * @param positions - The official Discord role position payload.
   * @param reason - Optional audit-log reason.
   * @returns The updated roles, or an empty array when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-role-positions
   */
  public async setPositions(
    guildId: string,
    positions: RESTPatchAPIGuildRolePositionsJSONBody,
    reason?: string,
  ): Promise<RoleStructureInstance[]> {
    const roles = (await this.client.rest.patch(Routes.guildRoles(guildId), {
      body: positions,
      reason,
    })) as APIRole[] | null;
    if (!roles) {
      return [];
    }

    return roles.map((role) => {
      const structure = new RoleStructure(role, guildId, this.client) as RoleStructureInstance;
      this._add(structure, { enabled: true, force: true });
      return structure;
    });
  }

  /**
   * Fetches the number of guild members assigned to each role.
   *
   * @param guildId - The guild ID.
   * @returns A map from role ID to member count.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-role-member-counts
   */
  public async fetchMemberCounts(guildId: string): Promise<RESTGetAPIGuildRoleMemberCountsResult> {
    return (await this.client.rest.get(
      Routes.guildRoleMemberCounts(guildId),
    )) as RESTGetAPIGuildRoleMemberCountsResult;
  }

  /**
   * Gets the roles cache.
   *
   * @returns The roles cache.
   */
  public get cache(): Cache<string, RoleStructureInstance> {
    return this._cache;
  }
}
