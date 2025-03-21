import type Client from "@/client";
import type { GatewayGuildScheduledEventUserRemoveDispatchData } from "discord-api-types/v10";

export default class GuildScheduledEventUserRemove {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildScheduledEventUserRemoveDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildScheduledEventUserRemoveDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildScheduledEventUserRemove", packet);
  }
}
