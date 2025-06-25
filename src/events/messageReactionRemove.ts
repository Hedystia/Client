import type { GatewayMessageReactionRemoveDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class MessageReactionRemove {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageReactionRemoveDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageReactionRemoveDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("messageReactionRemove", packet);
  }
}
