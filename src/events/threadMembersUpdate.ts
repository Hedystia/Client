import type { GatewayThreadMembersUpdateDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

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
    this.client.emit("threadMembersUpdate", packet);
  }
}
