import type { GatewayGuildIntegrationsUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildIntegrationsUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildIntegrationsUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildIntegrationsUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildIntegrationsUpdate", packet);
  }
}
