import type Client from "@/client";
import type { GatewayApplicationCommandPermissionsUpdateDispatchData } from "discord-api-types/v10";

export default class ApplicationCommandPermissionsUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayApplicationCommandPermissionsUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayApplicationCommandPermissionsUpdateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("applicationCommandPermissionsUpdate", packet);
  }
}
