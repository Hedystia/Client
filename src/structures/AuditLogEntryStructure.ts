import type { GatewayGuildAuditLogEntryCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class AuditLogEntryStructure<
  T extends
    GatewayGuildAuditLogEntryCreateDispatchData = GatewayGuildAuditLogEntryCreateDispatchData,
> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }
}

export default AuditLogEntryStructure as new <
  T extends
    GatewayGuildAuditLogEntryCreateDispatchData = GatewayGuildAuditLogEntryCreateDispatchData,
>(
  data: T,
  client: Client,
) => AuditLogEntryStructure<T> & T & { readonly client: Client };

export type AuditLogEntryStructureInstance = AuditLogEntryStructure &
  GatewayGuildAuditLogEntryCreateDispatchData & { readonly client: Client };
