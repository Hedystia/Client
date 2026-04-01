import type { GatewayEntitlementUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import EntitlementStructure from "../structures/EntitlementStructure";

export default class EntitlementUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayEntitlementUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayEntitlementUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const entitlementStructure = new EntitlementStructure(packet, this.client);
    this.client.entitlements._add(entitlementStructure, { enabled: true, force: true });

    this.client.emit("entitlementUpdate", entitlementStructure);
  }
}
