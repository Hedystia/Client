import type { GatewayChannelCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ChannelStructure from "../structures/ChannelStructure";

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

    const channelStructure = new ChannelStructure(packet, this.client);
    this.client.channels._add(channelStructure, {
      enabled: true,
      force: false,
    });

    this.client.emit("channelCreate", channelStructure);
  }
}
