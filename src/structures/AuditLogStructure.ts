import type { APIAuditLog, APIAuditLogEntry } from "discord-api-types/v10";
import type Client from "../client";
import { Collection } from "../utils/Collection";

/**
 * Wraps an official Discord audit-log response.
 *
 * The raw response fields remain available, while `entries` provides a
 * Keyed collection for convenient audit-log lookups.
 */
class AuditLogStructure<T extends APIAuditLog = APIAuditLog> {
  public readonly client: Client;
  public readonly entries: Collection<string, APIAuditLogEntry>;

  /**
   * @param data - The official Discord audit-log response.
   * @param client - The client instance that owns the response.
   */
  public constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.client = client;
    this.entries = new Collection(
      data.audit_log_entries.map((entry) => [entry.id, entry] as const),
    );
  }

  /**
   * Gets one audit-log entry by ID.
   * @param entryId - The audit-log entry ID.
   * @returns The matching entry, or undefined.
   */
  public get(entryId: string): APIAuditLogEntry | undefined {
    return this.entries.get(entryId);
  }

  /**
   * Gets the number of entries in this response.
   * @returns The entry count.
   */
  public get entryCount(): number {
    return this.entries.size;
  }

  /**
   * Converts this wrapper back to the official API response shape.
   * @returns The official Discord audit-log response.
   */
  public toJSON(): T {
    const data = this as unknown as APIAuditLog;
    return {
      application_commands: data.application_commands,
      webhooks: data.webhooks,
      users: data.users,
      audit_log_entries: [...this.entries.values()],
      auto_moderation_rules: data.auto_moderation_rules,
      integrations: data.integrations,
      threads: data.threads,
      guild_scheduled_events: data.guild_scheduled_events,
    } as T;
  }
}

export default AuditLogStructure as new <T extends APIAuditLog = APIAuditLog>(
  data: T,
  client: Client,
) => AuditLogStructure<T> & T & { readonly client: Client };

export type AuditLogStructureInstance = AuditLogStructure &
  APIAuditLog & { readonly client: Client };
