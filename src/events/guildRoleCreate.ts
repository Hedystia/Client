import type { GatewayGuildRoleCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import RoleStructure from "../structures/RoleStructure";

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

    const roleStructure = new RoleStructure(packet.role, this.client);
    this.client.roles._add(roleStructure, {
      enabled: true,
      force: false,
    });

    this.client.emit("guildRoleCreate", roleStructure);
  }
}
