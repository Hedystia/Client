import type { GatewayGuildScheduledEventCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildScheduledEventStructure from "../structures/GuildScheduledEventStructure";

export default class GuildScheduledEventCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildScheduledEventCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildScheduledEventCreateDispatchData }): Promise<void> {
    const packet = data.d;

    const eventStructure = new GuildScheduledEventStructure(packet, this.client);
    this.client.scheduledEvents._add(eventStructure, { enabled: true, force: false });

    this.client.emit("guildScheduledEventCreate", eventStructure);
  }
}
