import type Client from "@/client";
import type { GatewayChannelPinsUpdateDispatchData } from "discord-api-types/v10";

export default class ChannelPinsUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayChannelPinsUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayChannelPinsUpdateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("channelPinsUpdate", packet);
  }
}
