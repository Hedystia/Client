import { ChannelType, type GatewayChannelUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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
    if (packet.type === ChannelType.GuildCategory) {
      const categories = this.client.categories.get(packet.guild_id);
      if (categories) {
        const index = categories.findIndex((c) => c.id === packet.id);
        if (index !== -1) {
          categories[index] = packet;
          this.client.categories.set(packet.guild_id, categories);
        }
      }
    } else if (
      packet.type === ChannelType.GuildText ||
      packet.type === ChannelType.GuildAnnouncement
    ) {
      const channels = this.client.channels.get(packet.guild_id);
      if (channels) {
        const index = channels.findIndex((c) => c.id === packet.id);
        if (index !== -1) {
          channels[index] = packet;
          this.client.channels.set(packet.guild_id, channels);
        }
      }
    }
    this.client.emit("channelUpdate", packet);
  }
}
