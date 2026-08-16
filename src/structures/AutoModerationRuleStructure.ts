import type {
  APIAutoModerationRule,
  RESTPatchAPIAutoModerationRuleJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";

class AutoModerationRuleStructure<T extends APIAutoModerationRule = APIAutoModerationRule> {
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.guildId = guildId;
    this.client = client;
  }

  /**
   * Edits this auto-moderation rule.
   *
   * @param data - The official Discord auto-moderation edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited rule, or null when Discord returned no data.
   */
  public edit(
    data: RESTPatchAPIAutoModerationRuleJSONBody,
    reason?: string,
  ): Promise<AutoModerationRuleStructureInstance | null> {
    const rule = this as unknown as APIAutoModerationRule;
    return this.client.autoModerationRules.edit(this.guildId, rule.id, data, reason);
  }

  /**
   * Deletes this auto-moderation rule.
   *
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   */
  public delete(reason?: string): Promise<void> {
    const rule = this as unknown as APIAutoModerationRule;
    return this.client.autoModerationRules.delete(this.guildId, rule.id, reason);
  }
}

export default AutoModerationRuleStructure as new <
  T extends APIAutoModerationRule = APIAutoModerationRule,
>(
  data: T,
  guildId: string,
  client: Client,
) => AutoModerationRuleStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type AutoModerationRuleStructureInstance = AutoModerationRuleStructure &
  APIAutoModerationRule & { readonly guildId: string; readonly client: Client };
