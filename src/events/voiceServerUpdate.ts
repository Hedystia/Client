import type { GatewayVoiceServerUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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
    this.client.emit("voiceServerUpdate", packet);
  }
}
