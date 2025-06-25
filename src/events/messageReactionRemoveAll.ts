import type { GatewayMessageReactionRemoveAllDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class MessageReactionRemoveAll {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageReactionRemoveAllDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageReactionRemoveAllDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("messageReactionRemoveAll", packet);
  }
}
