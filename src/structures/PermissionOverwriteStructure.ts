import type { APIOverwrite, OverwriteType, Snowflake } from "discord-api-types/v10";
import type {
  PermissionOverwriteOptions,
  PermissionOverwriteRequestOptions,
} from "../types/PermissionOverwrite";
import PermissionsBitField from "../utils/PermissionsBitField";

/**
 * The channel operations required by a permission-overwrite structure.
 */
export interface PermissionOverwriteStructureChannel {
  permissionOverwrites: {
    edit(
      id: string,
      options: PermissionOverwriteOptions,
      requestOptions?: PermissionOverwriteRequestOptions,
    ): Promise<unknown>;
    delete(id: string, reason?: string): Promise<unknown>;
  };
}

/**
 * Represents a role or member permission overwrite in a guild channel.
 */
class PermissionOverwriteStructure {
  /** The ID of the role or member targeted by this overwrite. */
  public readonly id: Snowflake;
  /** The official Discord overwrite type. */
  public readonly type: OverwriteType;
  /** The permissions explicitly allowed by this overwrite. */
  public readonly allow: Readonly<PermissionsBitField>;
  /** The permissions explicitly denied by this overwrite. */
  public readonly deny: Readonly<PermissionsBitField>;
  /** The channel containing this overwrite. */
  public readonly channel: PermissionOverwriteStructureChannel;

  /**
   * Creates a permission-overwrite structure.
   *
   * @param data - The official Discord overwrite object.
   * @param channel - The channel containing the overwrite.
   */
  public constructor(data: APIOverwrite, channel: PermissionOverwriteStructureChannel) {
    this.id = data.id;
    this.type = data.type;
    this.allow = new PermissionsBitField(BigInt(data.allow)).freeze();
    this.deny = new PermissionsBitField(BigInt(data.deny)).freeze();
    this.channel = channel;
  }

  /**
   * Edits this overwrite, preserving its current allow and deny values when unspecified.
   *
   * @param options - Permission names mapped to allowed, denied, or unset states.
   * @param reason - Optional audit-log reason.
   * @returns This overwrite after the request is accepted.
   */
  public async edit(
    options: PermissionOverwriteOptions,
    reason?: string,
  ): Promise<PermissionOverwriteStructureInstance> {
    await this.channel.permissionOverwrites.edit(this.id, options, {
      type: this.type,
      reason,
    });
    return this as PermissionOverwriteStructureInstance;
  }

  /**
   * Deletes this overwrite from its channel.
   *
   * @param reason - Optional audit-log reason.
   * @returns This overwrite after the request is accepted.
   */
  public async delete(reason?: string): Promise<PermissionOverwriteStructureInstance> {
    await this.channel.permissionOverwrites.delete(this.id, reason);
    return this as PermissionOverwriteStructureInstance;
  }

  /**
   * Converts this structure back to the official Discord overwrite payload.
   *
   * @returns The official Discord overwrite object.
   */
  public toJSON(): APIOverwrite {
    return {
      id: this.id,
      type: this.type,
      allow: this.allow.toJSON(),
      deny: this.deny.toJSON(),
    };
  }
}

export default PermissionOverwriteStructure;

export type PermissionOverwriteStructureInstance = PermissionOverwriteStructure;
