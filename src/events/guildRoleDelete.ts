import type { APIRole, GatewayGuildRoleDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import RoleStructure from "../structures/RoleStructure";

export default class GuildRoleDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildRoleDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildRoleDeleteDispatchData }): Promise<void> {
    const packet = data.d;

    const cachedRole = this.client.roles.cache.get(packet.role_id);
    if (cachedRole) {
      this.client.emit("guildRoleDelete", cachedRole);
      this.client.roles._remove(packet.role_id);
    } else {
      const roleStructure = new RoleStructure({ id: packet.role_id } as APIRole, this.client);
      this.client.emit("guildRoleDelete", roleStructure);
    }
  }
}
