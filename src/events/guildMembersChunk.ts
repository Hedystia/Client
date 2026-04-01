import type { GatewayGuildMembersChunkDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import MemberStructure from "../structures/MemberStructure";

export default class GuildMembersChunk {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildMembersChunkDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildMembersChunkDispatchData }): Promise<void> {
    const packet = data.d;
    const guildId = packet.guild_id;

    // Add all members from the chunk
    for (const member of packet.members) {
      const memberStructure = new MemberStructure(member, guildId, this.client);
      this.client.members._add(memberStructure, {
        enabled: true,
        force: false,
      });
    }

    this.client.emit("guildMembersChunk", packet);
  }
}
