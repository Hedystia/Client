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
