import type { GatewayGuildRoleUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildRoleUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildRoleUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildRoleUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildRoleUpdate", packet);
  }
}
