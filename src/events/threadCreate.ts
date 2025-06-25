import type { GatewayThreadCreateDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class ThreadCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayThreadCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayThreadCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("threadCreate", packet);
  }
}
