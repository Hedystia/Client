import type Client from "@/client";
import type { GatewayGuildUpdateDispatchData } from "discord-api-types/v10";

export default class GuildUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildUpdateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildUpdate", packet);
  }
}
