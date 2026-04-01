import type { GatewayPresenceUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import PresenceStructure from "../structures/PresenceStructure";

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

  async _patch(data: { d: GatewayPresenceUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const presenceStructure = new PresenceStructure(packet, packet.guild_id, this.client);
    this.client.emit("presenceUpdate", presenceStructure);
  }
}
