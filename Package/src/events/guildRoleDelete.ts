import type Client from "@/client";
import type { GatewayGuildRoleDeleteDispatchData } from "discord-api-types/v10";

export default class GuildRoleDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildRoleDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayGuildRoleDeleteDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildRoleDelete", packet);
  }
}
