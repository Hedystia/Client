import type { GatewayGuildUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildStructure from "../structures/GuildStructure";

export default class GuildUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const guildStructure = new GuildStructure(packet, this.client);
    this.client.guilds._add(guildStructure, { enabled: true, force: true });

    this.client.emit("guildUpdate", guildStructure);
  }
}
