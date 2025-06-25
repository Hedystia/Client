import type Client from "@/client";
import type { GatewayEntitlementCreateDispatchData } from "discord-api-types/v10";

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

  async _patch(data: {
    d: GatewayEntitlementCreateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("entitlementCreate", packet);
  }
}
