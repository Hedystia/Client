import type { GatewayVoiceStateUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import VoiceStateStructure from "../structures/VoiceStateStructure";

export default class VoiceStateUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayVoiceStateUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayVoiceStateUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    if (!packet.guild_id) {
      return;
    }

    const voiceStateStructure = new VoiceStateStructure(packet, packet.guild_id, this.client);
    this.client.emit("voiceStateUpdate", voiceStateStructure);
  }
}
