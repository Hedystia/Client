import type { APIChannel, GatewayThreadDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ChannelStructure from "../structures/ChannelStructure";

export default class ThreadDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayThreadDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayThreadDeleteDispatchData }): Promise<void> {
    const packet = data.d;

    const cachedChannel = this.client.channels.cache.get(packet.id);
    if (cachedChannel) {
      this.client.emit("threadDelete", cachedChannel);
      this.client.channels._remove(packet.id);
    } else {
      const channelStructure = new ChannelStructure(packet as APIChannel, this.client);
      this.client.emit("threadDelete", channelStructure);
    }
  }
}
