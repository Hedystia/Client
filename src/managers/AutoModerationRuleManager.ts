import type {
  APIAutoModerationRule,
  RESTDeleteAPIAutoModerationRuleResult,
  RESTPatchAPIAutoModerationRuleJSONBody,
  RESTPostAPIAutoModerationRuleJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import type { AutoModerationRuleStructureInstance } from "../structures/AutoModerationRuleStructure";
import AutoModerationRuleStructure from "../structures/AutoModerationRuleStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class AutoModerationRuleManager {
  client: Client;
  private readonly _cache = new Cache<string, AutoModerationRuleStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(
    data: AutoModerationRuleStructureInstance,
    cache: { enabled: boolean; force: boolean },
  ): void {
    if (cache.enabled && data.id) {
      const rule = this._cache.get(data.id);
      if (rule && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  public _remove(id: string): void {
    this._cache.delete(id);
  }

  public get(id: string): AutoModerationRuleStructureInstance | undefined {
    return this._cache.get(id);
  }

  public async fetch(
    guildId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<AutoModerationRuleStructureInstance[]> {
    const cached: AutoModerationRuleStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const rule of this._cache.values()) {
        if (rule.guildId === guildId) {
          cached.push(rule);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const rules = (await this.client.rest.get(Routes.guildAutoModerationRules(guildId))) as
      | APIAutoModerationRule[]
      | null;

    if (!rules) {
      return cached;
    }

    return rules.map((rule) => {
      const ruleStructure = new AutoModerationRuleStructure(rule, guildId, this.client);
      this._add(ruleStructure, { enabled: true, force: false });
      return ruleStructure;
    });
  }

  /**
   * Creates an auto-moderation rule in a guild.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord auto-moderation rule body.
   * @param reason - Optional audit-log reason.
   * @returns The created rule, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/auto-moderation#create-auto-moderation-rule
   */
  public async create(
    guildId: string,
    data: RESTPostAPIAutoModerationRuleJSONBody,
    reason?: string,
  ): Promise<AutoModerationRuleStructureInstance | null> {
    const rule = (await this.client.rest.post(Routes.guildAutoModerationRules(guildId), {
      body: data,
      reason,
    })) as APIAutoModerationRule | null;
    if (!rule) {
      return null;
    }
    const structure = new AutoModerationRuleStructure(rule, guildId, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Fetches one auto-moderation rule.
   *
   * @param guildId - The guild ID.
   * @param ruleId - The rule ID.
   * @returns The rule, or null when it was not found.
   * @see https://docs.discord.com/developers/resources/auto-moderation#get-auto-moderation-rule
   */
  public async fetchOne(
    guildId: string,
    ruleId: string,
  ): Promise<AutoModerationRuleStructureInstance | null> {
    const rule = (await this.client.rest.get(
      Routes.guildAutoModerationRule(guildId, ruleId),
    )) as APIAutoModerationRule | null;
    if (!rule) {
      return null;
    }
    const structure = new AutoModerationRuleStructure(rule, guildId, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Edits an auto-moderation rule.
   *
   * @param guildId - The guild ID.
   * @param ruleId - The rule ID.
   * @param data - The official Discord auto-moderation edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited rule, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/auto-moderation#modify-auto-moderation-rule
   */
  public async edit(
    guildId: string,
    ruleId: string,
    data: RESTPatchAPIAutoModerationRuleJSONBody,
    reason?: string,
  ): Promise<AutoModerationRuleStructureInstance | null> {
    const rule = (await this.client.rest.patch(Routes.guildAutoModerationRule(guildId, ruleId), {
      body: data,
      reason,
    })) as APIAutoModerationRule | null;
    if (!rule) {
      return null;
    }
    const structure = new AutoModerationRuleStructure(rule, guildId, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Deletes an auto-moderation rule.
   *
   * @param guildId - The guild ID.
   * @param ruleId - The rule ID.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/auto-moderation#delete-auto-moderation-rule
   */
  public async delete(
    guildId: string,
    ruleId: string,
    reason?: string,
  ): Promise<RESTDeleteAPIAutoModerationRuleResult> {
    await this.client.rest.delete(Routes.guildAutoModerationRule(guildId, ruleId), { reason });
    this._remove(ruleId);
  }

  /**
   * Gets the auto-moderation rule cache.
   *
   * @returns The auto-moderation rule cache.
   */
  public get cache(): Cache<string, AutoModerationRuleStructureInstance> {
    return this._cache;
  }
}
