import {
  type APIUnavailableGuild,
  ChannelType,
  type GatewayGuildCreateDispatchData,
  GatewayOpcodes,
} from "discord-api-types/v10";
import type Client from "../client";

type GuildCreateData = GatewayGuildCreateDispatchData | APIUnavailableGuild;

function isUnavailableGuild(data: GuildCreateData): data is APIUnavailableGuild {
  return "unavailable" in data && data.unavailable === true;
}

export default class GuildCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GuildCreateData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GuildCreateData }): Promise<void> {
    const packet = data.d;
    if (isUnavailableGuild(packet)) {
      this.client.emit("guildUnavailable", packet);
      return;
    }
    const guildStructure = this.client.guilds.transformStructure(
      this.client.guilds.transformPayload(packet),
    );
    this.client.guilds._add(guildStructure, {
      enabled: true,
      force: false,
    });
    const categories = packet.channels.filter((c) => c.type === ChannelType.GuildCategory);
    const textChannels = packet.channels.filter(
      (c) => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement,
    );
    this.client.categories.set(packet.id, categories);
    this.client.channels.set(packet.id, textChannels);
    this.client.roles.set(packet.id, packet.roles);
    this.client.members.set(packet.id, packet.members);
    this.requestMembers(packet);
    this.client.emit("guildCreate", packet);
  }

  requestMembers(guild: GuildCreateData) {
    const guildId = guild.id;
    for (const [_, shard] of this.client.shards) {
      shard.ws.send(
        JSON.stringify({
          op: GatewayOpcodes.RequestGuildMembers,
          d: {
            guild_id: guildId,
            query: "",
            limit: 0,
          },
        }),
      );
    }
  }
}
