import type { APIWebhook, GatewayWebhooksUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import WebhookStructure from "../structures/WebhookStructure";

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

  async _patch(data: { d: GatewayWebhooksUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const webhookStructure = new WebhookStructure(packet as APIWebhook, this.client);
    this.client.emit("webhooksUpdate", webhookStructure);
  }
}
