import type {
  APIUser,
  RESTDeleteAPICurrentUserApplicationRoleConnectionResult,
  RESTGetAPICurrentUserApplicationRoleConnectionResult,
  RESTGetAPICurrentUserConnectionsResult,
  RESTGetAPICurrentUserGuildsQuery,
  RESTGetAPICurrentUserGuildsResult,
  RESTGetCurrentUserGuildMemberResult,
  RESTPatchAPICurrentUserJSONBody,
  RESTPatchAPICurrentUserResult,
  RESTPostAPICurrentUserCreateDMChannelJSONBody,
  RESTPostAPICurrentUserCreateDMChannelResult,
  RESTPutAPICurrentUserApplicationRoleConnectionJSONBody,
  RESTPutAPICurrentUserApplicationRoleConnectionResult,
} from "discord-api-types/v10";
import type Client from "../client";
import type { ManagerCacheConfig } from "../client";
import type { ChannelStructureInstance } from "../structures/ChannelStructure";
import ChannelStructure from "../structures/ChannelStructure";
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
   * @link https://discord.com/developers/docs/resources/user#get-user
   * @returns {Promise<UserStructureInstance | null>} The user data
   */
  public async fetch(
    id: string,
    options?: {
      cache?: {
        force: boolean;
      };
    },
  ): Promise<UserStructureInstance | null> {
    const user = (await this.client.rest.get(Routes.user(id)).catch(() => null)) as APIUser | null;
    if (!user) {
      return null;
    }
    const userStructure = new UserStructure(user, this.client);
    this._add(userStructure, {
      enabled: true,
      force: options?.cache?.force ?? false,
    });
    return userStructure;
  }

  /**
   * Fetches the current bot user.
   *
   * @returns The current user, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/user#get-current-user
   */
  public async fetchCurrent(): Promise<UserStructureInstance | null> {
    const user = (await this.client.rest.get(Routes.user())) as APIUser | null;
    if (!user) {
      return null;
    }
    const structure = new UserStructure(user, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Edits the current bot user.
   *
   * @param data - The official current-user edit body.
   * @returns The edited user, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/user#modify-current-user
   */
  public async editCurrent(
    data: RESTPatchAPICurrentUserJSONBody,
  ): Promise<RESTPatchAPICurrentUserResult | null> {
    const user = (await this.client.rest.patch(Routes.user(), {
      body: data,
    })) as RESTPatchAPICurrentUserResult | null;
    if (user) {
      const structure = new UserStructure(user, this.client);
      this._add(structure, { enabled: true, force: true });
    }
    return user;
  }

  /**
   * Fetches the guilds visible to the current bot user.
   *
   * @param query - The official current-user guild query fields.
   * @returns The partial guild payloads returned by Discord.
   * @see https://docs.discord.com/developers/resources/user#get-current-user-guilds
   */
  public async fetchGuilds(
    query: RESTGetAPICurrentUserGuildsQuery = {},
  ): Promise<RESTGetAPICurrentUserGuildsResult> {
    const params = Object.fromEntries(
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return (await this.client.rest.get(Routes.userGuilds(), { query: params })) as
      | RESTGetAPICurrentUserGuildsResult
      | [];
  }

  /**
   * Fetches the current user's guild member object.
   *
   * @param guildId - The guild ID.
   * @returns The official guild-member payload.
   * @see https://docs.discord.com/developers/resources/user#get-current-user-guild-member
   */
  public async fetchGuildMember(
    guildId: string,
  ): Promise<RESTGetCurrentUserGuildMemberResult | null> {
    return (await this.client.rest.get(
      Routes.userGuildMember(guildId),
    )) as RESTGetCurrentUserGuildMemberResult | null;
  }

  /**
   * Opens or fetches a direct-message channel with a user.
   *
   * @param data - The official create-DM request body.
   * @returns The created DM channel, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/user#create-dm
   */
  public async createDM(
    data: RESTPostAPICurrentUserCreateDMChannelJSONBody,
  ): Promise<ChannelStructureInstance | null> {
    const channel = (await this.client.rest.post(Routes.userChannels(), {
      body: data,
    })) as RESTPostAPICurrentUserCreateDMChannelResult | null;
    if (!channel) {
      return null;
    }
    const structure = new ChannelStructure(
      channel,
      this.client,
    ) as unknown as ChannelStructureInstance;
    this.client.channels.set(channel.id, structure);
    return structure;
  }

  /**
   * Leaves a guild as the current user.
   *
   * @param guildId - The guild ID.
   * @see https://docs.discord.com/developers/resources/user#leave-guild
   */
  public async leaveGuild(guildId: string): Promise<void> {
    await this.client.rest.delete(Routes.userGuild(guildId));
    this.client.guilds._remove(guildId);
  }

  /**
   * Fetches the connections linked to the current user.
   *
   * @returns The official connection payloads.
   * @see https://docs.discord.com/developers/resources/user#get-user-connections
   */
  public async fetchConnections(): Promise<RESTGetAPICurrentUserConnectionsResult> {
    return (await this.client.rest.get(Routes.userConnections())) as
      | RESTGetAPICurrentUserConnectionsResult
      | [];
  }

  /**
   * Fetches the current user's application role connection.
   *
   * @param applicationId - The application ID.
   * @returns The official application role-connection payload, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/user#get-user-application-role-connection
   */
  public async fetchApplicationRoleConnection(
    applicationId: string,
  ): Promise<RESTGetAPICurrentUserApplicationRoleConnectionResult | null> {
    return (await this.client.rest.get(
      Routes.userApplicationRoleConnection(applicationId),
    )) as RESTGetAPICurrentUserApplicationRoleConnectionResult | null;
  }

  /**
   * Updates the current user's application role connection.
   *
   * @param applicationId - The application ID.
   * @param data - The official application role-connection body.
   * @returns The updated role connection, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/user#update-user-application-role-connection
   */
  public async editApplicationRoleConnection(
    applicationId: string,
    data: RESTPutAPICurrentUserApplicationRoleConnectionJSONBody,
  ): Promise<RESTPutAPICurrentUserApplicationRoleConnectionResult | null> {
    return (await this.client.rest.put(Routes.userApplicationRoleConnection(applicationId), {
      body: data,
    })) as RESTPutAPICurrentUserApplicationRoleConnectionResult | null;
  }

  /**
   * Deletes the current user's application role connection.
   *
   * @param applicationId - The application ID.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/user#delete-current-user-application-role-connection
   */
  public async deleteApplicationRoleConnection(
    applicationId: string,
  ): Promise<RESTDeleteAPICurrentUserApplicationRoleConnectionResult> {
    return (await this.client.rest.delete(
      Routes.userApplicationRoleConnection(applicationId),
    )) as RESTDeleteAPICurrentUserApplicationRoleConnectionResult;
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
