import type { GatewayGuildEmojisUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildEmojiStructure from "../structures/GuildEmojiStructure";

export default class GuildEmojisUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildEmojisUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildEmojisUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    const guildId = packet.guild_id;

    // Clear existing emojis for this guild
    for (const [id, emoji] of this.client.emojis.cache.entries()) {
      if (emoji.guildId === guildId) {
        this.client.emojis._remove(id);
      }
    }

    // Add new emojis
    for (const emoji of packet.emojis) {
      const emojiStructure = new GuildEmojiStructure(emoji, guildId, this.client);
      this.client.emojis._add(emojiStructure, {
        enabled: true,
        force: false,
      });
    }

    this.client.emit("guildEmojisUpdate", packet);
  }
}
