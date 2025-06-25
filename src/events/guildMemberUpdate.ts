import type { APIGuildMember, GatewayGuildMemberUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildMemberUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildMemberUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildMemberUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    const guildId = packet.guild_id;
    let members = this.client.members.get(guildId);
    if (!members) {
      members = [];
      this.client.members.set(guildId, members);
    }
    if (!members.some((m) => m.user.id === packet.user.id)) {
      members.push(packet as APIGuildMember);
    }
    this.client.emit("guildMemberUpdate", packet);
  }
}
