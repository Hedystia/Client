import type { GatewayGuildScheduledEventDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import GuildScheduledEventStructure from "../structures/GuildScheduledEventStructure";

export default class GuildScheduledEventDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildScheduledEventDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildScheduledEventDeleteDispatchData }): Promise<void> {
    const packet = data.d;

    const cachedEvent = this.client.scheduledEvents.cache.get(packet.id);
    if (cachedEvent) {
      this.client.emit("guildScheduledEventDelete", cachedEvent);
      this.client.scheduledEvents._remove(packet.id);
    } else {
      const eventStructure = new GuildScheduledEventStructure(packet, this.client);
      this.client.emit("guildScheduledEventDelete", eventStructure);
    }
  }
}
