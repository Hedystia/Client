import type { GatewayChannelPinsUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import ChannelPinsStructure from "../structures/ChannelPinsStructure";

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

  async _patch(data: { d: GatewayChannelPinsUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const pinsStructure = new ChannelPinsStructure(packet, this.client);
    this.client.emit("channelPinsUpdate", pinsStructure);
  }
}
