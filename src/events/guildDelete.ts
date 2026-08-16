import type {
  APIGuild,
  APIUnavailableGuild,
  GatewayGuildDeleteDispatchData,
} from "discord-api-types/v10";
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
    if (packet.unavailable) {
      this.client.emit("guildUnavailable", packet as APIUnavailableGuild);
      return;
    }

    const cachedGuild = this.client.guilds.cache.get(packet.id);

    if (cachedGuild) {
      this.client.emit("guildDelete", cachedGuild);
    } else {
      const guildStructure = new GuildStructure(packet as APIGuild, this.client);
      this.client.emit("guildDelete", guildStructure);
    }

    this.client.channels._removeGuild(packet.id);
    this.client.roles._removeGuild(packet.id);
    this.client.members._remove(packet.id);
    for (const [messageId, message] of this.client.messages.entries()) {
      if (message.guildId === packet.id) {
        this.client.messages.delete(messageId);
      }
    }
    this.client.guilds._remove(packet.id);
  }
}
