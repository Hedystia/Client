import type { GatewayGuildBanRemoveDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildBanStructure from "../structures/GuildBanStructure";

export default class GuildBanRemove {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildBanRemoveDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildBanRemoveDispatchData }): Promise<void> {
    const packet = data.d;

    const cachedBan = this.client.bans.cache.get(packet.user.id);
    if (cachedBan) {
      this.client.emit("guildBanRemove", cachedBan);
      this.client.bans._remove(packet.user.id);
    } else {
      const banStructure = new GuildBanStructure(packet, packet.guild_id, this.client);
      this.client.emit("guildBanRemove", banStructure);
    }
  }
}
