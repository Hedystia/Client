import type { GatewayThreadListSyncDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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
    this.client.emit("threadListSync", packet);
  }
}
