import type { GatewayMessageReactionAddDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class MessageReactionAdd {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageReactionAddDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageReactionAddDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("messageReactionAdd", packet);
  }
}
