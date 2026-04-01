import type { GatewayGuildAuditLogEntryCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import AuditLogEntryStructure from "../structures/AuditLogEntryStructure";

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

    const entryStructure = new AuditLogEntryStructure(packet, this.client);
    this.client.emit("guildAuditLogEntryCreate", entryStructure);
  }
}
