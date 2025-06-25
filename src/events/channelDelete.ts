import type { GatewayChannelDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class ChannelDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayChannelDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayChannelDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("channelDelete", packet);
  }
}
