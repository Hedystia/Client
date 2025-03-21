import type Client from "@/client";
import type { GatewaySoundboardSoundsDispatchData } from "discord-api-types/v10";

export default class SoundboardSounds {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewaySoundboardSoundsDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewaySoundboardSoundsDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("soundboardSounds", packet);
  }
}
