import type { GatewayGuildMembersChunkDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

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
    this.client.emit("guildMembersChunk", packet);
  }
}
