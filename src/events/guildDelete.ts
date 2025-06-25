import type { GatewayGuildDeleteDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class GuildDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    const cachedGuild = this.client.isCacheEnabled("guilds")
      ? this.client.guilds.cache.get(packet.id)
      : null;

    this.client.emit("guildDelete", cachedGuild ?? packet);

    if (cachedGuild) {
      this.client.guilds._remove(packet.id);
    }
  }
}
