import type { GatewayGuildSoundboardSoundsUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class GuildSoundboardSoundsUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildSoundboardSoundsUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildSoundboardSoundsUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildSoundboardSoundsUpdate", packet);
  }
}
