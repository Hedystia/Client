import type { APIUnavailableGuild, GatewayGuildCreateDispatchData } from "discord-api-types/v10";
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
    this.client.channels.set(packet.id, packet.channels);
    this.client.roles.set(packet.id, packet.roles);
    this.client.members.set(packet.id, packet.members);
    this.client.emit("guildCreate", packet);
  }
}
