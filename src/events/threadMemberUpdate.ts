import type { GatewayThreadMemberUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ThreadMemberStructure from "../structures/ThreadMemberStructure";

export default class ThreadMemberUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayThreadMemberUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayThreadMemberUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    const threadId = packet.id;

    if (!threadId) {
      return;
    }

    const memberStructure = new ThreadMemberStructure(
      packet,
      threadId,
      packet.guild_id,
      this.client,
    );
    this.client.threadMembers._add(memberStructure, { enabled: true, force: false });

    this.client.emit("threadMemberUpdate", memberStructure);
  }
}
