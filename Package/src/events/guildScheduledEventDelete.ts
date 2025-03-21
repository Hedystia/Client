import type Client from "@/client";
import type { GatewayGuildScheduledEventDeleteDispatchData } from "discord-api-types/v10";

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

  async _patch(data: {
    d: GatewayGuildScheduledEventDeleteDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildScheduledEventDelete", packet);
  }
}
