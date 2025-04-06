import type Client from "@/client";
import GuildStructure from "@/structures/GuildStructure";
import type { GatewayGuildCreateDispatchData } from "discord-api-types/v10";

export default class GuildCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildCreateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    const guildStructure = new GuildStructure(this.client.guilds.transformPayload(packet));
    if (this.client.isCacheEnabled("guilds")) {
      this.client.guilds._add(guildStructure, {
        enabled: true,
        force: false,
      });
    }
    this.client.emit("guildCreate", packet);
  }
}
