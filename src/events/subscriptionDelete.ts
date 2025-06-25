import type { GatewaySubscriptionDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class SubscriptionDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewaySubscriptionDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewaySubscriptionDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("subscriptionDelete", packet);
  }
}
