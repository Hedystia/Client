import type { GatewayThreadDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class ThreadDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayThreadDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayThreadDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("threadDelete", packet);
  }
}
