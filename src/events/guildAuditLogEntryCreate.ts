import type { GatewayGuildAuditLogEntryCreateDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class GuildAuditLogEntryCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayGuildAuditLogEntryCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayGuildAuditLogEntryCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("guildAuditLogEntryCreate", packet);
  }
}
