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
    const roles = this.client.roles.get(packet.guild_id);
    if (roles) {
      const index = roles.findIndex((r) => r.id === packet.role.id);
      if (index !== -1) {
        roles[index] = packet.role;
        this.client.roles.set(packet.guild_id, roles);
      }
    }
    this.client.emit("guildRoleUpdate", packet);
  }
}
