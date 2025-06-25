import type { GatewayChannelCreateDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class ChannelCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayChannelCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayChannelCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("channelCreate", packet);
  }
}
