import type Client from "@/client";
import type { GatewayGuildDeleteDispatchData } from "discord-api-types/v10";

export default class GuildDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildDeleteDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildDelete", packet);
  }
}
