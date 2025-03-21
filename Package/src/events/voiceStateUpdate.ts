import type Client from "@/client";
import type { GatewayVoiceStateUpdateDispatchData } from "discord-api-types/v10";

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

  async _patch(data: {
    d: GatewayVoiceStateUpdateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("voiceStateUpdate", packet);
  }
}
