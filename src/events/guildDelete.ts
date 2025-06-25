import type { GatewayGuildDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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
    const cachedGuild = this.client.guilds.cache.get(packet.id);

    this.client.emit("guildDelete", cachedGuild ?? packet);
    this.client.channels.delete(packet.id);
    this.client.roles.delete(packet.id);
    this.client.members.delete(packet.id);

    if (cachedGuild) {
      this.client.guilds._remove(packet.id);
    }
  }
}
