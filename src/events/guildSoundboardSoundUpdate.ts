import type { GatewayGuildSoundboardSoundUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildSoundboardSoundUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildSoundboardSoundUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildSoundboardSoundUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildSoundboardSoundUpdate", packet);
  }
}
