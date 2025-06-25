import type { GatewayEntitlementUpdateDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

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
    this.client.emit("entitlementUpdate", packet);
  }
}
