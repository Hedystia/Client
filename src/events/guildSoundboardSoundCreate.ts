import type { GatewayGuildSoundboardSoundCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildSoundboardSoundCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildSoundboardSoundCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildSoundboardSoundCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildSoundboardSoundCreate", packet);
  }
}
