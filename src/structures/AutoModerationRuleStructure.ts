import type { APIAutoModerationRule } from "discord-api-types/v10";
import type Client from "../client";

class AutoModerationRuleStructure<T extends APIAutoModerationRule = APIAutoModerationRule> {
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.guildId = guildId;
    this.client = client;
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
