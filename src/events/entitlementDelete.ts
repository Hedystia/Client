import type { GatewayEntitlementDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import EntitlementStructure from "../structures/EntitlementStructure";

export default class EntitlementDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayEntitlementDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayEntitlementDeleteDispatchData }): Promise<void> {
    const packet = data.d;

    const cachedEntitlement = this.client.entitlements.cache.get(packet.id);
    if (cachedEntitlement) {
      this.client.emit("entitlementDelete", cachedEntitlement);
      this.client.entitlements._remove(packet.id);
    } else {
      const entitlementStructure = new EntitlementStructure(packet, this.client);
      this.client.emit("entitlementDelete", entitlementStructure);
    }
  }
}
