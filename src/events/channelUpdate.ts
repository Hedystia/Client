import type { GatewayChannelUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class ChannelUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayChannelUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayChannelUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("channelUpdate", packet);
  }
}
