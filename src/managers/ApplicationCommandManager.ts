import type {
  APIApplicationCommand,
  RESTGetAPIApplicationCommandPermissionsResult,
  RESTGetAPIApplicationCommandsQuery,
  RESTGetAPIApplicationCommandsResult,
  RESTGetAPIApplicationGuildCommandsResult,
  RESTGetAPIGuildApplicationCommandsPermissionsResult,
  RESTPatchAPIApplicationCommandJSONBody,
  RESTPatchAPIApplicationCommandResult,
  RESTPatchAPIApplicationGuildCommandJSONBody,
  RESTPatchAPIApplicationGuildCommandResult,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIApplicationCommandsResult,
  RESTPostAPIApplicationGuildCommandsJSONBody,
  RESTPostAPIApplicationGuildCommandsResult,
  RESTPutAPIApplicationCommandPermissionsJSONBody,
  RESTPutAPIApplicationCommandPermissionsResult,
  RESTPutAPIApplicationCommandsJSONBody,
  RESTPutAPIApplicationCommandsResult,
  RESTPutAPIApplicationGuildCommandsJSONBody,
  RESTPutAPIApplicationGuildCommandsResult,
  RESTPutAPIGuildApplicationCommandsPermissionsJSONBody,
  RESTPutAPIGuildApplicationCommandsPermissionsResult,
} from "discord-api-types/v10";
import type Client from "../client";
import { Collection } from "../utils/Collection";
import { Routes } from "../utils/constants";

/**
 * Fetch options accepted by the application-command manager.
 */
export interface ApplicationCommandFetchOptions extends RESTGetAPIApplicationCommandsQuery {
  /** Whether to skip the local cache. */
  force?: boolean;
}

type CommandCreateData =
  | RESTPostAPIApplicationCommandsJSONBody
  | RESTPostAPIApplicationGuildCommandsJSONBody;
type CommandEditData =
  | RESTPatchAPIApplicationCommandJSONBody
  | RESTPatchAPIApplicationGuildCommandJSONBody;
type CommandCollection = Collection<string, APIApplicationCommand>;

/**
 * Manages application-command permissions for a guild.
 */
export class ApplicationCommandPermissionManager {
  public readonly client: Client;
  public readonly applicationCommands: ApplicationCommandManager;

  /**
   * @param client - The client instance that owns this manager.
   * @param applicationCommands - The parent application-command manager.
   */
  public constructor(client: Client, applicationCommands: ApplicationCommandManager) {
    this.client = client;
    this.applicationCommands = applicationCommands;
  }

  /**
   * Fetches permissions for every command in a guild.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord command-permission payloads.
   * @see https://docs.discord.com/developers/interactions/application-commands#get-guild-application-command-permissions
   */
  public async fetchGuild(
    guildId: string,
  ): Promise<RESTGetAPIGuildApplicationCommandsPermissionsResult | null> {
    const applicationId = this.client.me?.id;
    if (!applicationId) {
      throw new Error("Client is not logged in");
    }
    return (await this.client.rest.get(
      Routes.guildApplicationCommandsPermissions(applicationId, guildId),
    )) as RESTGetAPIGuildApplicationCommandsPermissionsResult | null;
  }

  /**
   * Fetches permissions for one application command in a guild.
   *
   * @param guildId - The guild ID.
   * @param commandId - The command ID.
   * @returns The official Discord command-permission payload.
   * @see https://docs.discord.com/developers/interactions/application-commands#get-application-command-permissions
   */
  public async fetch(
    guildId: string,
    commandId: string,
  ): Promise<RESTGetAPIApplicationCommandPermissionsResult | null> {
    const applicationId = this.client.me?.id;
    if (!applicationId) {
      throw new Error("Client is not logged in");
    }
    return (await this.client.rest.get(
      Routes.applicationCommandPermissions(applicationId, guildId, commandId),
    )) as RESTGetAPIApplicationCommandPermissionsResult | null;
  }

  /**
   * Replaces permissions for one application command in a guild.
   *
   * @param guildId - The guild ID.
   * @param commandId - The command ID.
   * @param data - The official Discord permission body.
   * @returns The updated permission payload.
   * @see https://docs.discord.com/developers/interactions/application-commands#edit-application-command-permissions
   */
  public async set(
    guildId: string,
    commandId: string,
    data: RESTPutAPIApplicationCommandPermissionsJSONBody,
  ): Promise<RESTPutAPIApplicationCommandPermissionsResult | null> {
    const applicationId = this.client.me?.id;
    if (!applicationId) {
      throw new Error("Client is not logged in");
    }
    return (await this.client.rest.put(
      Routes.applicationCommandPermissions(applicationId, guildId, commandId),
      { body: data },
    )) as RESTPutAPIApplicationCommandPermissionsResult | null;
  }

  /**
   * Replaces permissions for every application command in a guild.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord batch permission body.
   * @returns The updated permission payloads.
   * @see https://docs.discord.com/developers/interactions/application-commands#batch-edit-application-command-permissions
   */
  public async setGuild(
    guildId: string,
    data: RESTPutAPIGuildApplicationCommandsPermissionsJSONBody,
  ): Promise<RESTPutAPIGuildApplicationCommandsPermissionsResult | null> {
    const applicationId = this.client.me?.id;
    if (!applicationId) {
      throw new Error("Client is not logged in");
    }
    return (await this.client.rest.put(
      Routes.guildApplicationCommandsPermissions(applicationId, guildId),
      { body: data },
    )) as RESTPutAPIGuildApplicationCommandsPermissionsResult | null;
  }
}

/**
 * Manages global or guild application commands using Discord's official REST API.
 *
 * This manager intentionally returns official `discord-api-types/v10` command
 * payloads instead of maintaining a second handwritten command model.
 */
export default class ApplicationCommandManager {
  public readonly client: Client;
  public readonly guildId?: string;
  public readonly permissions: ApplicationCommandPermissionManager;
  private readonly _cache = new Collection<string, APIApplicationCommand>();

  /**
   * @param client - The client instance that owns this manager.
   * @param guildId - The guild ID for a guild-scoped manager.
   */
  public constructor(client: Client, guildId?: string) {
    this.client = client;
    this.guildId = guildId;
    this.permissions = new ApplicationCommandPermissionManager(client, this);
  }

  /**
   * Builds the REST path for this manager.
   * @param commandId - An optional command ID.
   * @returns The application-command route.
   */
  private commandPath(commandId?: string): string {
    const applicationId = this.client.me?.id;
    if (!applicationId) {
      throw new Error("Client is not logged in");
    }

    if (this.guildId) {
      return commandId
        ? Routes.applicationGuildCommand(applicationId, this.guildId, commandId)
        : Routes.applicationGuildCommands(applicationId, this.guildId);
    }

    return commandId
      ? Routes.applicationCommand(applicationId, commandId)
      : Routes.applicationCommands(applicationId);
  }

  /**
   * Fetches one command or all commands.
   *
   * @param commandId - A command ID, or fetch options for the full collection.
   * @returns One official command payload, or a collection of command payloads.
   * @see https://docs.discord.com/developers/interactions/application-commands#get-global-application-commands
   */
  public async fetch(commandId: string): Promise<APIApplicationCommand | null>;
  public async fetch(options?: ApplicationCommandFetchOptions): Promise<CommandCollection>;
  public async fetch(
    commandIdOrOptions?: string | ApplicationCommandFetchOptions,
  ): Promise<APIApplicationCommand | null | CommandCollection> {
    const fetchOptions = typeof commandIdOrOptions === "string" ? undefined : commandIdOrOptions;
    const optionsForce = fetchOptions?.force ?? false;

    if (typeof commandIdOrOptions === "string") {
      if (!commandIdOrOptions) {
        return null;
      }
      const cached = this._cache.get(commandIdOrOptions);
      if (cached && !optionsForce) {
        return cached;
      }

      const command = (await this.client.rest.get(
        this.commandPath(commandIdOrOptions),
      )) as APIApplicationCommand | null;
      if (command) {
        this._cache.set(command.id, command);
      }
      return command;
    }

    const query = fetchOptions
      ? Object.fromEntries(
          Object.entries(fetchOptions)
            .filter(([key, value]) => key !== "force" && value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined;
    const commands = (await this.client.rest.get(this.commandPath(), { query })) as
      | RESTGetAPIApplicationCommandsResult
      | RESTGetAPIApplicationGuildCommandsResult
      | null;
    const result = new Collection<string, APIApplicationCommand>();
    for (const command of commands ?? []) {
      result.set(command.id, command as APIApplicationCommand);
      this._cache.set(command.id, command as APIApplicationCommand);
    }
    return result;
  }

  /**
   * Creates one application command.
   *
   * @param data - The official Discord application-command body.
   * @returns The created command.
   * @see https://docs.discord.com/developers/interactions/application-commands#create-global-application-command
   */
  public async create(data: CommandCreateData): Promise<APIApplicationCommand | null> {
    const command = (await this.client.rest.post(this.commandPath(), {
      body: data,
    })) as RESTPostAPIApplicationCommandsResult | RESTPostAPIApplicationGuildCommandsResult | null;
    if (!command) {
      return null;
    }
    this._cache.set(command.id, command as APIApplicationCommand);
    return command as APIApplicationCommand;
  }

  /**
   * Replaces every command in this scope.
   *
   * @param commands - The official Discord bulk-overwrite command bodies.
   * @returns The resulting command collection.
   * @see https://docs.discord.com/developers/interactions/application-commands#bulk-overwrite-global-application-commands
   */
  public async set(
    commands: RESTPutAPIApplicationCommandsJSONBody | RESTPutAPIApplicationGuildCommandsJSONBody,
  ): Promise<CommandCollection> {
    const result = (await this.client.rest.put(this.commandPath(), {
      body: commands,
    })) as RESTPutAPIApplicationCommandsResult | RESTPutAPIApplicationGuildCommandsResult | null;
    this._cache.clear();
    const collection = new Collection<string, APIApplicationCommand>();
    for (const command of result ?? []) {
      const apiCommand = command as APIApplicationCommand;
      collection.set(apiCommand.id, apiCommand);
      this._cache.set(apiCommand.id, apiCommand);
    }
    return collection;
  }

  /**
   * Edits an application command.
   *
   * @param commandId - The command ID.
   * @param data - The official Discord command-edit body.
   * @returns The edited command.
   * @see https://docs.discord.com/developers/interactions/application-commands#edit-global-application-command
   */
  public async edit(
    commandId: string,
    data: CommandEditData,
  ): Promise<APIApplicationCommand | null> {
    const command = (await this.client.rest.patch(this.commandPath(commandId), {
      body: data,
    })) as RESTPatchAPIApplicationCommandResult | RESTPatchAPIApplicationGuildCommandResult | null;
    if (!command) {
      return null;
    }
    this._cache.set(command.id, command as APIApplicationCommand);
    return command as APIApplicationCommand;
  }

  /**
   * Deletes an application command.
   *
   * @param commandId - The command ID.
   * @returns The cached command, or null when it was not cached.
   * @see https://docs.discord.com/developers/interactions/application-commands#delete-global-application-command
   */
  public async delete(commandId: string): Promise<APIApplicationCommand | null> {
    await this.client.rest.delete(this.commandPath(commandId));
    const command = this._cache.get(commandId) ?? null;
    this._cache.delete(commandId);
    return command;
  }

  /**
   * Gets the command cache.
   * @returns The cached official command payloads.
   */
  public get cache(): CommandCollection {
    return this._cache;
  }

  /**
   * Creates a guild-scoped application-command manager.
   * @param guildId - The guild ID.
   * @returns A manager scoped to the guild.
   */
  public forGuild(guildId: string): ApplicationCommandManager {
    return new ApplicationCommandManager(this.client, guildId);
  }
}
