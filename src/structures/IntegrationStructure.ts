import type { APIGuildIntegration } from "discord-api-types/v10";
import type Client from "../client";

class IntegrationStructure<T extends APIGuildIntegration = APIGuildIntegration> {
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
    return (this as unknown as APIGuildIntegration).id;
  }

  public get name(): string {
    return (this as unknown as APIGuildIntegration).name;
  }

  public get type(): string {
    return (this as unknown as APIGuildIntegration).type;
  }

  public get enabled(): boolean {
    return (this as unknown as APIGuildIntegration).enabled ?? false;
  }

  public get syncing(): boolean | null {
    return (this as unknown as APIGuildIntegration).syncing ?? null;
  }

  public get roleId(): string | null {
    return (this as unknown as APIGuildIntegration).role_id ?? null;
  }

  public get userId(): string | null {
    return (this as unknown as APIGuildIntegration).user?.id ?? null;
  }
}

export default IntegrationStructure as new <T extends APIGuildIntegration = APIGuildIntegration>(
  data: T,
  guildId: string,
  client: Client,
) => IntegrationStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type IntegrationStructureInstance = IntegrationStructure &
  APIGuildIntegration & { readonly guildId: string; readonly client: Client };
