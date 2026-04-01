import type { GatewayGuildStickersUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildStickerStructure from "../structures/GuildStickerStructure";

export default class GuildStickersUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildStickersUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildStickersUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    const guildId = packet.guild_id;

    // Clear existing stickers for this guild
    for (const [id, sticker] of this.client.stickers.cache.entries()) {
      if (sticker.guildId === guildId) {
        this.client.stickers._remove(id);
      }
    }

    // Add new stickers
    for (const sticker of packet.stickers) {
      const stickerStructure = new GuildStickerStructure(sticker, guildId, this.client);
      this.client.stickers._add(stickerStructure, {
        enabled: true,
        force: false,
      });
    }

    this.client.emit("guildStickersUpdate", packet);
  }
}
