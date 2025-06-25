import type { GatewayGuildRoleCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildRoleCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildRoleCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildRoleCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildRoleCreate", packet);
  }
}
