import type { GatewaySubscriptionUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import SubscriptionStructure from "../structures/SubscriptionStructure";

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

    const subscriptionStructure = new SubscriptionStructure(packet, this.client);
    this.client.subscriptions._add(subscriptionStructure, { enabled: true, force: true });

    this.client.emit("subscriptionUpdate", subscriptionStructure);
  }
}
