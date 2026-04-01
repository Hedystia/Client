import type { GatewayChannelUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ChannelStructure from "../structures/ChannelStructure";

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

    const channelStructure = new ChannelStructure(packet, this.client);
    this.client.channels._update(channelStructure);

    this.client.emit("channelUpdate", channelStructure);
  }
}
