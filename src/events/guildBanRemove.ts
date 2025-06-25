import type { GatewayGuildBanRemoveDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

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

  async _patch(data: { d: GatewayGuildBanRemoveDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildBanRemove", packet);
  }
}
