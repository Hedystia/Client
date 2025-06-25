import type { GatewayChannelCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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
    const channels = this.client.channels.get(packet.guild_id);
    if (channels) {
      channels.push(packet);
      this.client.channels.set(packet.guild_id, channels);
    } else {
      this.client.channels.set(packet.guild_id, [packet]);
    }
    this.client.emit("channelCreate", packet);
  }
}
