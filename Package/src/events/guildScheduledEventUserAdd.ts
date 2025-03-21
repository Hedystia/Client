import type Client from "@/client";
import type { GatewayGuildScheduledEventUserAddDispatchData } from "discord-api-types/v10";

export default class GuildScheduledEventUserAdd {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildScheduledEventUserAddDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildScheduledEventUserAddDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildScheduledEventUserAdd", packet);
  }
}
