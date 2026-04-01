import type { APIGuildMember, GatewayGuildMemberUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import MemberStructure from "../structures/MemberStructure";

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

    const memberStructure = new MemberStructure(packet as APIGuildMember, guildId, this.client);
    this.client.members._update(memberStructure);

    this.client.emit("guildMemberUpdate", memberStructure);
  }
}
