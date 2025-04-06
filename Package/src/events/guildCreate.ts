import type Client from "@/client";
import type { APIUnavailableGuild, GatewayGuildCreateDispatchData } from "discord-api-types/v10";

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

  async _patch(data: {
    d: GuildCreateData;
  }): Promise<void> {
    const packet = data.d;
    if (isUnavailableGuild(packet)) {
      this.client.emit("guildUnavailable", packet);
      return;
    }
    const guildStructure = this.client.guilds.transformStructure(
      this.client.guilds.transformPayload(packet),
    );
    if (this.client.isCacheEnabled("guilds")) {
      this.client.guilds._add(guildStructure, {
        enabled: true,
        force: false,
      });
    }
    this.client.emit("guildCreate", packet);
  }
}
