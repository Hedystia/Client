import type { GatewayThreadMembersUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ThreadMembersStructure from "../structures/ThreadMembersStructure";

export default class ThreadMembersUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayThreadMembersUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayThreadMembersUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const threadMembersStructure = new ThreadMembersStructure(packet, this.client);
    this.client.emit("threadMembersUpdate", threadMembersStructure);
  }
}
