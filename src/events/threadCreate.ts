import type { GatewayThreadCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ChannelStructure from "../structures/ChannelStructure";

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

    const channelStructure = new ChannelStructure(packet, this.client);
    this.client.channels._add(channelStructure, {
      enabled: true,
      force: false,
    });

    this.client.emit("threadCreate", channelStructure);
  }
}
