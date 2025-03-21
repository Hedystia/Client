import type Client from "@/client";
import type { GatewayPresenceUpdateDispatchData } from "discord-api-types/v10";

export default class PresenceUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayPresenceUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayPresenceUpdateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("presenceUpdate", packet);
  }
}
