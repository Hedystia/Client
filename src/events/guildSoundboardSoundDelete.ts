import type { GatewayGuildSoundboardSoundDeleteDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class GuildSoundboardSoundDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildSoundboardSoundDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildSoundboardSoundDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildSoundboardSoundDelete", packet);
  }
}
