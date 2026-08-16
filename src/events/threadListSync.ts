import type { GatewayThreadListSyncDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ChannelStructure from "../structures/ChannelStructure";
import ThreadListSyncStructure from "../structures/ThreadListSyncStructure";
import ThreadMemberStructure from "../structures/ThreadMemberStructure";

export default class ThreadListSync {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayThreadListSyncDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayThreadListSyncDispatchData }): Promise<void> {
    const packet = data.d;

    for (const thread of packet.threads) {
      const threadStructure = new ChannelStructure(thread, this.client);
      this.client.channels._add(threadStructure, { enabled: true, force: false });
    }

    for (const member of packet.members) {
      if (!member.id) {
        continue;
      }
      const memberStructure = new ThreadMemberStructure(
        member,
        member.id,
        packet.guild_id,
        this.client,
      );
      this.client.threadMembers._add(memberStructure, { enabled: true, force: false });
    }

    const threadListSyncStructure = new ThreadListSyncStructure(packet, this.client);
    this.client.emit("threadListSync", threadListSyncStructure);
  }
}
