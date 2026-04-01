import type {
  APIGuildIntegration,
  GatewayIntegrationDeleteDispatchData,
} from "discord-api-types/v10";
import type Client from "../client";
import IntegrationStructure from "../structures/IntegrationStructure";

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

    const cachedIntegration = this.client.integrations.cache.get(packet.id);
    if (cachedIntegration) {
      this.client.emit("integrationDelete", cachedIntegration);
      this.client.integrations._remove(packet.id);
    } else {
      const integrationStructure = new IntegrationStructure(
        packet as unknown as APIGuildIntegration,
        packet.guild_id,
        this.client,
      );
      this.client.emit("integrationDelete", integrationStructure);
    }
  }
}
