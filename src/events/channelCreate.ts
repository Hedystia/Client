import { ChannelType, type GatewayChannelCreateDispatchData } from "discord-api-types/v10";
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

    if (packet.type === ChannelType.GuildCategory) {
      const categories = this.client.categories.get(packet.guild_id) ?? [];
      categories.push(packet);
      this.client.categories.set(packet.guild_id, categories);
    } else if (
      packet.type === ChannelType.GuildText ||
      packet.type === ChannelType.GuildAnnouncement
    ) {
      const channels = this.client.channels.get(packet.guild_id) ?? [];
      channels.push(packet);
      this.client.channels.set(packet.guild_id, channels);
    }

    this.client.emit("channelCreate", packet);
  }
}
