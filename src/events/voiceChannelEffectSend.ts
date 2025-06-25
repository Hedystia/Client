import type { GatewayVoiceChannelEffectSendDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

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
    this.client.emit("voiceChannelEffectSend", packet);
  }
}
