import type Client from "@/client";
import type { GatewayGuildEmojisUpdateDispatchData } from "discord-api-types/v10";

export default class GuildEmojisUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildEmojisUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildEmojisUpdateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildEmojisUpdate", packet);
  }
}
