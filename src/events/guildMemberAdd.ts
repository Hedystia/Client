import type { GatewayGuildMemberAddDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildMemberAdd {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildMemberAddDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildMemberAddDispatchData }): Promise<void> {
    const packet = data.d;
    const guildId = packet.guild_id;
    let members = this.client.members.get(guildId);
    if (!members) {
      members = [];
      this.client.members.set(guildId, members);
    }
    if (!members.some((m) => m.user.id === packet.user.id)) {
      members.push(packet);
    }
    this.client.emit("guildMemberAdd", packet);
  }
}
