import type { GatewayEntitlementCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import EntitlementStructure from "../structures/EntitlementStructure";

export default class EntitlementCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayEntitlementCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayEntitlementCreateDispatchData }): Promise<void> {
    const packet = data.d;

    const entitlementStructure = new EntitlementStructure(packet, this.client);
    this.client.entitlements._add(entitlementStructure, { enabled: true, force: false });

    this.client.emit("entitlementCreate", entitlementStructure);
  }
}
