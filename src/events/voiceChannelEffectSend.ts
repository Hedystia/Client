import type { GatewayVoiceChannelEffectSendDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import VoiceChannelEffectSendStructure from "../structures/VoiceChannelEffectSendStructure";

export default class VoiceChannelEffectSend {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayVoiceChannelEffectSendDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayVoiceChannelEffectSendDispatchData }): Promise<void> {
    const packet = data.d;

    const effectStructure = new VoiceChannelEffectSendStructure(packet, this.client);
    this.client.emit("voiceChannelEffectSend", effectStructure);
  }
}
