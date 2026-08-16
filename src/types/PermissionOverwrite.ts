import type { OverwriteType, PermissionFlagsBits } from "discord-api-types/v10";

/**
 * Permission states accepted by a channel permission overwrite.
 *
 * `true` allows a permission, `false` denies it, and `null` removes both
 * explicit overrides for that permission.
 */
export type PermissionOverwriteOptions = Partial<
  Record<keyof typeof PermissionFlagsBits, boolean | null>
>;

/** Additional options for creating or editing an overwrite. */
export interface PermissionOverwriteRequestOptions {
  /** Explicitly selects a role or member overwrite. */
  type?: OverwriteType;
  /** Optional audit-log reason. */
  reason?: string;
}
