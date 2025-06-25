import type Client from "@/client";
import type { GatewayMessageDeleteBulkDispatchData } from "discord-api-types/v10";

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

  async _patch(data: {
    d: GatewayMessageDeleteBulkDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("messageDeleteBulk", packet);
  }
}
