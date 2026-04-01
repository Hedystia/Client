import type { GatewayIntegrationCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import IntegrationStructure from "../structures/IntegrationStructure";

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

    const integrationStructure = new IntegrationStructure(packet, packet.guild_id, this.client);
    this.client.integrations._add(integrationStructure, { enabled: true, force: false });

    this.client.emit("integrationCreate", integrationStructure);
  }
}
