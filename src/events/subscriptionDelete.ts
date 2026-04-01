import type { GatewaySubscriptionDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import SubscriptionStructure from "../structures/SubscriptionStructure";

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

    const cachedSubscription = this.client.subscriptions.cache.get(packet.id);
    if (cachedSubscription) {
      this.client.emit("subscriptionDelete", cachedSubscription);
      this.client.subscriptions._remove(packet.id);
    } else {
      const subscriptionStructure = new SubscriptionStructure(packet, this.client);
      this.client.emit("subscriptionDelete", subscriptionStructure);
    }
  }
}
