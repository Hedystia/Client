import type { GatewayGuildStickersUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildStickersUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildStickersUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildStickersUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildStickersUpdate", packet);
  }
}
