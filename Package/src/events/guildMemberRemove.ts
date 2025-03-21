import type Client from "@/client";
import type { GatewayGuildMemberRemoveDispatchData } from "discord-api-types/v10";

export default class GuildMemberRemove {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildMemberRemoveDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildMemberRemoveDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildMemberRemove", packet);
  }
}
