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
    const roles = this.client.roles.get(packet.guild_id);
    if (roles) {
      roles.push(packet.role);
      this.client.roles.set(packet.guild_id, roles);
    } else {
      this.client.roles.set(packet.guild_id, [packet.role]);
    }
    this.client.emit("guildRoleCreate", packet);
  }
}
