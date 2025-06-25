import type { GatewayGuildMemberRemoveDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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

  async _patch(data: { d: GatewayGuildMemberRemoveDispatchData }): Promise<void> {
    const packet = data.d;
    const guildId = packet.guild_id;
    const members = this.client.members.get(guildId);
    if (members) {
      const index = members.findIndex((m) => m.user.id === packet.user.id);
      if (index !== -1) {
        members.splice(index, 1);
      }
    }
    this.client.emit("guildMemberRemove", packet);
  }
}
