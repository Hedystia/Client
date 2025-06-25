import type { GatewayMessageDeleteBulkDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class MessageDeleteBulk {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageDeleteBulkDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageDeleteBulkDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("messageDeleteBulk", packet);
  }
}
