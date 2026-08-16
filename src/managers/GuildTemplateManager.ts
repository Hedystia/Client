import type {
  APIGuild,
  APITemplate,
  RESTDeleteAPIGuildTemplateResult,
  RESTGetAPIGuildTemplatesResult,
  RESTGetAPITemplateResult,
  RESTPatchAPIGuildTemplateJSONBody,
  RESTPatchAPIGuildTemplateResult,
  RESTPostAPIGuildTemplatesJSONBody,
  RESTPostAPIGuildTemplatesResult,
  RESTPostAPITemplateCreateGuildJSONBody,
  RESTPostAPITemplateCreateGuildResult,
  RESTPutAPIGuildTemplateSyncResult,
} from "discord-api-types/v10";
import type Client from "../client";
import { Collection } from "../utils/Collection";
import { Routes } from "../utils/constants";

/**
 * Manages guild templates through Discord's official REST API.
 */
export default class GuildTemplateManager {
  public readonly client: Client;
  public readonly guildId?: string;
  private readonly _cache = new Collection<string, APITemplate>();

  /**
   * @param client - The client instance that owns this manager.
   * @param guildId - The guild ID for a guild-scoped manager.
   */
  public constructor(client: Client, guildId?: string) {
    this.client = client;
    this.guildId = guildId;
  }

  /**
   * Fetches a template by code.
   *
   * @param code - The template code.
   * @returns The official template payload, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/guild-template#get-guild-template
   */
  public async fetch(code: string): Promise<RESTGetAPITemplateResult | null> {
    const template = (await this.client.rest.get(
      Routes.template(code),
    )) as RESTGetAPITemplateResult | null;
    if (template) {
      this._cache.set(template.code, template);
    }
    return template;
  }

  /**
   * Fetches all templates for this guild.
   *
   * @returns The official template payloads.
   * @see https://docs.discord.com/developers/resources/guild-template#get-guild-templates
   */
  public async fetchAll(): Promise<RESTGetAPIGuildTemplatesResult> {
    if (!this.guildId) {
      throw new Error("A guild ID is required to fetch guild templates");
    }
    const templates = (await this.client.rest.get(
      Routes.guildTemplates(this.guildId),
    )) as RESTGetAPIGuildTemplatesResult | null;
    this._cache.clear();
    for (const template of templates ?? []) {
      this._cache.set(template.code, template);
    }
    return templates ?? [];
  }

  /**
   * Creates a template for this guild.
   *
   * @param data - The official template-create body.
   * @returns The created template, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/guild-template#create-guild-template
   */
  public async create(
    data: RESTPostAPIGuildTemplatesJSONBody,
  ): Promise<RESTPostAPIGuildTemplatesResult | null> {
    if (!this.guildId) {
      throw new Error("A guild ID is required to create a guild template");
    }
    const template = (await this.client.rest.post(Routes.guildTemplates(this.guildId), {
      body: data,
    })) as RESTPostAPIGuildTemplatesResult | null;
    if (template) {
      this._cache.set(template.code, template);
    }
    return template;
  }

  /**
   * Synchronizes a template with its source guild.
   *
   * @param code - The template code.
   * @returns The synchronized template, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/guild-template#sync-guild-template
   */
  public async sync(code: string): Promise<RESTPutAPIGuildTemplateSyncResult | null> {
    if (!this.guildId) {
      throw new Error("A guild ID is required to synchronize a guild template");
    }
    const template = (await this.client.rest.put(
      Routes.guildTemplate(this.guildId, code),
    )) as RESTPutAPIGuildTemplateSyncResult | null;
    if (template) {
      this._cache.set(template.code, template);
    }
    return template;
  }

  /**
   * Edits a template for this guild.
   *
   * @param code - The template code.
   * @param data - The official template-edit body.
   * @returns The edited template, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/guild-template#modify-guild-template
   */
  public async edit(
    code: string,
    data: RESTPatchAPIGuildTemplateJSONBody,
  ): Promise<RESTPatchAPIGuildTemplateResult | null> {
    if (!this.guildId) {
      throw new Error("A guild ID is required to edit a guild template");
    }
    const template = (await this.client.rest.patch(Routes.guildTemplate(this.guildId, code), {
      body: data,
    })) as RESTPatchAPIGuildTemplateResult | null;
    if (template) {
      this._cache.set(template.code, template);
    }
    return template;
  }

  /**
   * Deletes a template for this guild.
   *
   * @param code - The template code.
   * @returns The deleted template, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/guild-template#delete-guild-template
   */
  public async delete(code: string): Promise<RESTDeleteAPIGuildTemplateResult | null> {
    if (!this.guildId) {
      throw new Error("A guild ID is required to delete a guild template");
    }
    const template = (await this.client.rest.delete(
      Routes.guildTemplate(this.guildId, code),
    )) as RESTDeleteAPIGuildTemplateResult | null;
    this._cache.delete(code);
    return template;
  }

  /**
   * Creates a guild from a template.
   *
   * @param code - The template code.
   * @param data - The official template-guild body.
   * @returns The created guild, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/guild-template#create-guild-from-guild-template
   */
  public async createGuild(
    code: string,
    data: RESTPostAPITemplateCreateGuildJSONBody,
  ): Promise<RESTPostAPITemplateCreateGuildResult | null> {
    return (await this.client.rest.post(Routes.template(code), {
      body: data,
    })) as APIGuild | null;
  }

  /**
   * Gets the cached templates for this manager.
   * @returns Cached official template payloads.
   */
  public get cache(): Collection<string, APITemplate> {
    return this._cache;
  }

  /**
   * Creates a guild-scoped template manager.
   * @param guildId - The guild ID.
   * @returns A manager scoped to the guild.
   */
  public forGuild(guildId: string): GuildTemplateManager {
    return new GuildTemplateManager(this.client, guildId);
  }
}
