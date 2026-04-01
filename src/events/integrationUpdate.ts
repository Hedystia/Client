import type { GatewayIntegrationUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import IntegrationStructure from "../structures/IntegrationStructure";

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

    const integrationStructure = new IntegrationStructure(packet, packet.guild_id, this.client);
    this.client.integrations._add(integrationStructure, { enabled: true, force: true });

    this.client.emit("integrationUpdate", integrationStructure);
  }
}
