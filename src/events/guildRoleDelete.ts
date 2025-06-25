import type { GatewayGuildRoleDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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
    const roles = this.client.roles.get(packet.guild_id);
    if (roles) {
      const index = roles.findIndex((r) => r.id === packet.role_id);
      if (index !== -1) {
        roles.splice(index, 1);
        this.client.roles.set(packet.guild_id, roles);
      }
    }
    this.client.emit("guildRoleDelete", packet);
  }
}
