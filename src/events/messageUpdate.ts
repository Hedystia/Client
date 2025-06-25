import type Client from "@/client";
import type { GatewayMessageUpdateDispatchData } from "discord-api-types/v10";

export default class MessageUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayMessageUpdateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("messageUpdate", packet);
  }
}
