import type { GatewayGuildAuditLogEntryCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class AuditLogEntryStructure<
  T extends
    GatewayGuildAuditLogEntryCreateDispatchData = GatewayGuildAuditLogEntryCreateDispatchData,
> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
    this.client = client;
  }

  public get userId(): string | null {
    return (this as unknown as GatewayGuildAuditLogEntryCreateDispatchData).user_id ?? null;
  }

  public get actionType(): number {
    return (this as unknown as GatewayGuildAuditLogEntryCreateDispatchData).action_type;
  }

  public get changes(): Array<{ key: string; old?: unknown; new?: unknown }> | null {
    return (this as unknown as GatewayGuildAuditLogEntryCreateDispatchData).changes ?? null;
  }

  public get options(): unknown | null {
    return (this as unknown as GatewayGuildAuditLogEntryCreateDispatchData).options ?? null;
  }

  public get reason(): string | null {
    return (this as unknown as GatewayGuildAuditLogEntryCreateDispatchData).reason ?? null;
  }

  public get targetId(): string | null {
    return (this as unknown as GatewayGuildAuditLogEntryCreateDispatchData).target_id ?? null;
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
