import type { GatewaySubscriptionUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class SubscriptionUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewaySubscriptionUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewaySubscriptionUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("subscriptionUpdate", packet);
  }
}
