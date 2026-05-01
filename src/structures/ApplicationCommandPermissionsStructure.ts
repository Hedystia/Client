import type { GatewayApplicationCommandPermissionsUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class ApplicationCommandPermissionsStructure<
  T extends
    GatewayApplicationCommandPermissionsUpdateDispatchData = GatewayApplicationCommandPermissionsUpdateDispatchData,
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

export default ApplicationCommandPermissionsStructure as new <
  T extends
    GatewayApplicationCommandPermissionsUpdateDispatchData = GatewayApplicationCommandPermissionsUpdateDispatchData,
>(
  data: T,
  client: Client,
) => ApplicationCommandPermissionsStructure<T> & T & { readonly client: Client };

export type ApplicationCommandPermissionsStructureInstance =
  ApplicationCommandPermissionsStructure &
    GatewayApplicationCommandPermissionsUpdateDispatchData & { readonly client: Client };
