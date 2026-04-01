import type { GatewayGuildBanAddDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildBanStructure from "../structures/GuildBanStructure";

export default class GuildBanAdd {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildBanAddDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildBanAddDispatchData }): Promise<void> {
    const packet = data.d;

    const banStructure = new GuildBanStructure(packet, packet.guild_id, this.client);
    this.client.bans._add(banStructure, { enabled: true, force: false });

    this.client.emit("guildBanAdd", banStructure);
  }
}
