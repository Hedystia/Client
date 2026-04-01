import type {
  APISoundboardSound,
  GatewayGuildSoundboardSoundDeleteDispatchData,
} from "discord-api-types/v10";
import type Client from "../client";
import GuildSoundboardSoundStructure from "../structures/GuildSoundboardSoundStructure";

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

    const cachedSound = this.client.soundboardSounds.cache.get(packet.sound_id);
    if (cachedSound) {
      this.client.emit("guildSoundboardSoundDelete", cachedSound);
      this.client.soundboardSounds._remove(packet.sound_id);
    } else {
      const soundStructure = new GuildSoundboardSoundStructure(
        packet as APISoundboardSound,
        packet.guild_id,
        this.client,
      );
      this.client.emit("guildSoundboardSoundDelete", soundStructure);
    }
  }
}
