import type { GatewayApplicationCommandPermissionsUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ApplicationCommandPermissionsStructure from "../structures/ApplicationCommandPermissionsStructure";

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

  async _patch(data: { d: GatewayApplicationCommandPermissionsUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const permissionsStructure = new ApplicationCommandPermissionsStructure(packet, this.client);
    this.client.emit("applicationCommandPermissionsUpdate", permissionsStructure);
  }
}
