import type { GatewayVoiceStateUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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
    this.client.emit("voiceStateUpdate", packet);
  }
}
