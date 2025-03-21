import type Client from "@/client";
import type { GatewayGuildCreateDispatchData } from "discord-api-types/v10";

export default class GuildCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildCreateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildCreate", packet);
  }
}
