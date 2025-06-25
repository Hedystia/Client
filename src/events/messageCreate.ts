import type { GatewayMessageCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class MessageCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("messageCreate", packet);
  }
}
