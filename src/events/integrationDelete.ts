import type { GatewayIntegrationDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class IntegrationDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayIntegrationDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayIntegrationDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("integrationDelete", packet);
  }
}
