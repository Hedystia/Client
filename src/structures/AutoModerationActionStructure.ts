import type { GatewayAutoModerationActionExecutionDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class AutoModerationActionStructure<
  T extends
    GatewayAutoModerationActionExecutionDispatchData = GatewayAutoModerationActionExecutionDispatchData,
> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }

  public get guildId(): string {
    return (this as unknown as GatewayAutoModerationActionExecutionDispatchData).guild_id;
  }

  public get action(): GatewayAutoModerationActionExecutionDispatchData["action"] {
    return (this as unknown as GatewayAutoModerationActionExecutionDispatchData).action;
  }

  public get ruleId(): string {
    return (this as unknown as GatewayAutoModerationActionExecutionDispatchData).rule_id;
  }

  public get ruleTriggerType(): number {
    return (this as unknown as GatewayAutoModerationActionExecutionDispatchData).rule_trigger_type;
  }

  public get userId(): string {
    return (this as unknown as GatewayAutoModerationActionExecutionDispatchData).user_id;
  }

  public get content(): string {
    return (this as unknown as GatewayAutoModerationActionExecutionDispatchData).content;
  }

  public get channelId(): string | null {
    return (this as unknown as GatewayAutoModerationActionExecutionDispatchData).channel_id ?? null;
  }
}

export default AutoModerationActionStructure as new <
  T extends
    GatewayAutoModerationActionExecutionDispatchData = GatewayAutoModerationActionExecutionDispatchData,
>(
  data: T,
  client: Client,
) => AutoModerationActionStructure<T> & T & { readonly client: Client };

export type AutoModerationActionStructureInstance = AutoModerationActionStructure &
  GatewayAutoModerationActionExecutionDispatchData & { readonly client: Client };
