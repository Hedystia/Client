import type { GatewayGuildScheduledEventCreateDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

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
    this.client.emit("guildScheduledEventCreate", packet);
  }
}
