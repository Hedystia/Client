import type { GatewayIntegrationUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class IntegrationUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayIntegrationUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayIntegrationUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("integrationUpdate", packet);
  }
}
