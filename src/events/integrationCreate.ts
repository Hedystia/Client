import type { GatewayIntegrationCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class IntegrationCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayIntegrationCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayIntegrationCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("integrationCreate", packet);
  }
}
