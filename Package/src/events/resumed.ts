import type Client from "@/client";
import type { GatewayResumedDispatchData } from "discord-api-types/v10";

export default class Resumed {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayResumedDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayResumedDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("resumed", packet);
  }
}
