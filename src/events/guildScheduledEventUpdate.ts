import type { GatewayGuildScheduledEventUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

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
    this.client.emit("guildScheduledEventUpdate", packet);
  }
}
