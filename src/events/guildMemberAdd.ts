import type { GatewayGuildMemberAddDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import MemberStructure from "../structures/MemberStructure";

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

    const memberStructure = new MemberStructure(packet, guildId, this.client);
    this.client.members._add(memberStructure, {
      enabled: true,
      force: false,
    });

    this.client.emit("guildMemberAdd", memberStructure);
  }
}
