import type { GatewayGuildBanAddDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class GuildBanAdd {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildBanAddDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildBanAddDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildBanAdd", packet);
  }
}
