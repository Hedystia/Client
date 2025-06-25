import type { GatewayMessageDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class MessageDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("messageDelete", packet);
  }
}
