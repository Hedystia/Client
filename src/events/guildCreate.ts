import {
  type APIUnavailableGuild,
  type GatewayGuildCreateDispatchData,
  GatewayOpcodes,
} from "discord-api-types/v10";
import type Client from "../client";
import ChannelStructure from "../structures/ChannelStructure";
import GuildStructure from "../structures/GuildStructure";
import MemberStructure from "../structures/MemberStructure";
import RoleStructure from "../structures/RoleStructure";

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

    const guildStructure = new GuildStructure(packet, this.client);
    this.client.guilds._add(guildStructure, {
      enabled: true,
      force: false,
    });

    for (const channel of packet.channels) {
      const channelStructure = new ChannelStructure(channel, this.client);
      this.client.channels._add(channelStructure, {
        enabled: true,
        force: false,
      });
    }

    for (const role of packet.roles) {
      const roleStructure = new RoleStructure(role, this.client);
      this.client.roles._add(roleStructure, {
        enabled: true,
        force: false,
      });
    }

    for (const member of packet.members) {
      const memberStructure = new MemberStructure(member, packet.id, this.client);
      this.client.members._add(memberStructure, {
        enabled: true,
        force: false,
      });
    }

    this.requestMembers(packet);

    this.client.emit("guildCreate", guildStructure);
  }

  requestMembers(guild: GuildCreateData) {
    const guildId = guild.id;
    for (const [_, shard] of this.client.shards) {
      if (shard.ws) {
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
}
