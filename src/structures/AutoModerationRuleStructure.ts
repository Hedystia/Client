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

  public get id(): string {
    return (this as unknown as APIAutoModerationRule).id;
  }

  public get name(): string {
    return (this as unknown as APIAutoModerationRule).name;
  }

  public get creatorId(): string {
    return (this as unknown as APIAutoModerationRule).creator_id;
  }

  public get enabled(): boolean {
    return (this as unknown as APIAutoModerationRule).enabled ?? false;
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
