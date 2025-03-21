import type Client from "@/client";
import type { GatewayWebhooksUpdateDispatchData } from "discord-api-types/v10";

export default class WebhooksUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayWebhooksUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayWebhooksUpdateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("webhooksUpdate", packet);
  }
}
