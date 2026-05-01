import type { APIGuildMember, GatewayGuildMemberRemoveDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import MemberStructure from "../structures/MemberStructure";

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

    if (packet.user?.id) {
      const cachedMember = this.client.members.getMember(packet.guild_id, packet.user.id);
      if (cachedMember) {
        this.client.emit("guildMemberRemove", cachedMember);
        this.client.members._remove(packet.guild_id, packet.user.id);
      } else {
        const memberStructure = new MemberStructure(
          packet as unknown as APIGuildMember,
          packet.guild_id,
          this.client,
        );
        this.client.emit("guildMemberRemove", memberStructure);
      }
    }
  }
}
