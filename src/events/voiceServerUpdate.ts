import type { GatewayVoiceServerUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import VoiceServerUpdateStructure from "../structures/VoiceServerUpdateStructure";

export default class VoiceServerUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayVoiceServerUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayVoiceServerUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const voiceServerStructure = new VoiceServerUpdateStructure(packet, this.client);
    this.client.emit("voiceServerUpdate", voiceServerStructure);
  }
}
