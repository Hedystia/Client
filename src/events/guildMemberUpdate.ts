import type { GatewayGuildMemberUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildMemberUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildMemberUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildMemberUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildMemberUpdate", packet);
  }
}
