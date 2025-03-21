import type Client from "@/client";
import type { GatewayGuildBanRemoveDispatchData } from "discord-api-types/v10";

export default class GuildBanRemove {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildBanRemoveDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildBanRemoveDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildBanRemove", packet);
  }
}
