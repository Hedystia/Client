import type { GatewayGuildEmojisUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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

  async _patch(data: { d: GatewayGuildEmojisUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildEmojisUpdate", packet);
  }
}
