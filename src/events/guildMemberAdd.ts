import type Client from "@/client";
import type { GatewayGuildMemberAddDispatchData } from "discord-api-types/v10";

export default class GuildMemberAdd {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildMemberAddDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildMemberAddDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildMemberAdd", packet);
  }
}
