import type { GatewayGuildScheduledEventUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildScheduledEventStructure from "../structures/GuildScheduledEventStructure";

export default class GuildScheduledEventUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildScheduledEventUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildScheduledEventUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const eventStructure = new GuildScheduledEventStructure(packet, this.client);
    this.client.scheduledEvents._add(eventStructure, { enabled: true, force: true });

    this.client.emit("guildScheduledEventUpdate", eventStructure);
  }
}
