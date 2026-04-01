import type { APIGuild, GatewayGuildDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildStructure from "../structures/GuildStructure";

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

    if (cachedGuild) {
      this.client.emit("guildDelete", cachedGuild);
      this.client.channels._remove(packet.id);
      this.client.roles._remove(packet.id);
      this.client.members._remove(packet.id);
      this.client.guilds._remove(packet.id);
    } else {
      const guildStructure = new GuildStructure(packet as APIGuild, this.client);
      this.client.emit("guildDelete", guildStructure);
    }
  }
}
