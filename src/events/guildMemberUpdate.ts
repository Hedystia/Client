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
    const memberIndex = members.findIndex((m) => m.user.id === packet.user.id);
    if (memberIndex !== -1) {
      members[memberIndex] = packet as APIGuildMember;
    } else {
      members.push(packet as APIGuildMember);
    }
    this.client.emit("guildMemberUpdate", packet);
  }
}
