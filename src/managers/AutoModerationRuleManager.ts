import type { APIAutoModerationRule } from "discord-api-types/v10";
import type Client from "../client";
import type { AutoModerationRuleStructureInstance } from "../structures/AutoModerationRuleStructure";
import AutoModerationRuleStructure from "../structures/AutoModerationRuleStructure";
import Cache from "../utils/cache";

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

    const rules = (await this.client.rest.get(`/guilds/${guildId}/auto-moderation/rules`)) as
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

  public get cache(): Cache<string, AutoModerationRuleStructureInstance> {
    return this._cache;
  }
}
