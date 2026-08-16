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
    const channel = this.client.channels.get(packet.channel_id);
    if (channel && packet.last_pin_timestamp !== undefined) {
      Object.assign(channel, { last_pin_timestamp: packet.last_pin_timestamp });
    }

    const pinsStructure = new ChannelPinsStructure(packet, this.client);
    this.client.emit("channelPinsUpdate", pinsStructure);
  }
}
