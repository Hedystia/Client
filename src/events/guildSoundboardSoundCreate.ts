import type { GatewayGuildSoundboardSoundCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildSoundboardSoundStructure from "../structures/GuildSoundboardSoundStructure";

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

    const soundStructure = new GuildSoundboardSoundStructure(
      packet,
      packet.guild_id ?? "",
      this.client,
    );
    this.client.soundboardSounds._add(soundStructure, { enabled: true, force: false });
    this.client.emit("guildSoundboardSoundCreate", soundStructure);
  }
}
