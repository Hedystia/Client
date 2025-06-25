import type { GatewayEntitlementDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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
    this.client.emit("entitlementDelete", packet);
  }
}
