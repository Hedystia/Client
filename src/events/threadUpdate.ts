import type { GatewayThreadUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ChannelStructure from "../structures/ChannelStructure";

export default class ThreadUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayThreadUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayThreadUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const channelStructure = new ChannelStructure(packet, this.client);
    this.client.channels._update(channelStructure);

    this.client.emit("threadUpdate", channelStructure);
  }
}
