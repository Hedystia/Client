import type { GatewaySubscriptionCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import SubscriptionStructure from "../structures/SubscriptionStructure";

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

    const subscriptionStructure = new SubscriptionStructure(packet, this.client);
    this.client.subscriptions._add(subscriptionStructure, { enabled: true, force: false });

    this.client.emit("subscriptionCreate", subscriptionStructure);
  }
}
