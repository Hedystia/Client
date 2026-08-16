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
    const cachedMessage = this.client.messages.get(packet.id);
    this.client.messages.delete(packet.id);
    this.client.emit("messageDelete", cachedMessage ?? packet);
  }
}
