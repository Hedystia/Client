import type { GatewaySubscriptionCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class SubscriptionCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewaySubscriptionCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewaySubscriptionCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("subscriptionCreate", packet);
  }
}
