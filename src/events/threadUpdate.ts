import type Client from "@/client";
import type { GatewayThreadUpdateDispatchData } from "discord-api-types/v10";

export default class ThreadUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayThreadUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayThreadUpdateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("threadUpdate", packet);
  }
}
