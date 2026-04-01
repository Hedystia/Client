import type { GatewayGuildRoleUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import RoleStructure from "../structures/RoleStructure";

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

    const roleStructure = new RoleStructure(packet.role, this.client);
    this.client.roles._update(roleStructure);

    this.client.emit("guildRoleUpdate", roleStructure);
  }
}
