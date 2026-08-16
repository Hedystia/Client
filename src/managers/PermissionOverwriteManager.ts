import {
  type APIOverwrite,
  OverwriteType,
  type PermissionFlagsBits,
  type RESTPatchAPIChannelJSONBody,
  type RESTPutAPIChannelPermissionJSONBody,
} from "discord-api-types/v10";
import PermissionOverwriteStructure, {
  type PermissionOverwriteStructureChannel,
  type PermissionOverwriteStructureInstance,
} from "../structures/PermissionOverwriteStructure";
import type {
  PermissionOverwriteOptions,
  PermissionOverwriteRequestOptions,
} from "../types/PermissionOverwrite";
import Cache from "../utils/cache";
import PermissionsBitField, { type PermissionResolvable } from "../utils/PermissionsBitField";

export type {
  PermissionOverwriteOptions,
  PermissionOverwriteRequestOptions,
} from "../types/PermissionOverwrite";

/**
 * Minimal channel operations required by the overwrite manager.
 */
export interface PermissionOverwriteChannel {
  readonly id: string;
  readonly client: { roles: { get(id: string): unknown } };
  edit(
    data: RESTPatchAPIChannelJSONBody,
    reason?: string,
  ): Promise<PermissionOverwriteChannel | null>;
  editPermissionOverwrite(
    overwriteId: string,
    data: RESTPutAPIChannelPermissionJSONBody,
    reason?: string,
  ): Promise<void>;
  deletePermissionOverwrite(overwriteId: string, reason?: string): Promise<void>;
}

/**
 * Public permission-overwrite manager operations exposed by a channel.
 */
export interface PermissionOverwriteManagerInterface {
  readonly cache: Cache<string, PermissionOverwriteStructureInstance>;
  _add(data: APIOverwrite, force?: boolean): PermissionOverwriteStructureInstance;
  get(id: string): PermissionOverwriteStructureInstance | undefined;
  set(overwrites: APIOverwrite[], reason?: string): Promise<PermissionOverwriteChannel | null>;
  create(
    id: string,
    options: PermissionOverwriteOptions,
    requestOptions?: PermissionOverwriteRequestOptions,
  ): Promise<PermissionOverwriteChannel | null>;
  edit(
    id: string,
    options: PermissionOverwriteOptions,
    requestOptions?: PermissionOverwriteRequestOptions,
  ): Promise<PermissionOverwriteChannel | null>;
  delete(id: string, reason?: string): Promise<PermissionOverwriteChannel | null>;
}

/**
 * Manages the permission overwrites attached to a guild channel.
 */
export default class PermissionOverwriteManager {
  /** The client instance. */
  public readonly client: PermissionOverwriteChannel["client"];
  /** The channel containing these overwrites. */
  public readonly channel: PermissionOverwriteChannel;
  private readonly _cache = new Cache<string, PermissionOverwriteStructureInstance>();

  /**
   * Creates a permission overwrite manager.
   *
   * @param channel - The channel containing the overwrites.
   */
  public constructor(channel: PermissionOverwriteChannel) {
    this.channel = channel;
    this.client = channel.client;
  }

  /**
   * Adds an official overwrite payload to the local cache.
   *
   * @param data - The official Discord overwrite object.
   * @param force - Whether to replace an existing cached overwrite.
   * @returns The cached overwrite structure.
   */
  public _add(data: APIOverwrite, force = true): PermissionOverwriteStructureInstance {
    const existing = this._cache.get(data.id);
    if (existing && !force) {
      return existing;
    }
    const structure = new PermissionOverwriteStructure(
      data,
      this.channel as unknown as PermissionOverwriteStructureChannel,
    );
    this._cache.set(data.id, structure);
    return structure;
  }

  /**
   * Gets an overwrite by role or member ID.
   *
   * @param id - The role or member ID.
   * @returns The cached overwrite, if present.
   */
  public get(id: string): PermissionOverwriteStructureInstance | undefined {
    return this._cache.get(id);
  }

  /**
   * Replaces all permission overwrites in this channel.
   *
   * @param overwrites - Official Discord overwrite payloads.
   * @param reason - Optional audit-log reason.
   * @returns The edited channel, or null when Discord returned no data.
   */
  public async set(
    overwrites: APIOverwrite[],
    reason?: string,
  ): Promise<PermissionOverwriteChannel | null> {
    const updated = await this.channel.edit(
      {
        permission_overwrites: overwrites,
      },
      reason,
    );
    if (updated) {
      this._cache.clear();
      for (const overwrite of overwrites) {
        this._add(overwrite);
      }
    }
    return updated;
  }

  /**
   * Creates or replaces an overwrite for a role or member.
   *
   * @param id - The role or member ID.
   * @param options - Permission states to apply.
   * @param requestOptions - Overwrite type and audit-log options.
   * @returns The channel after the request is accepted.
   */
  public create(
    id: string,
    options: PermissionOverwriteOptions,
    requestOptions?: PermissionOverwriteRequestOptions,
  ): Promise<PermissionOverwriteChannel | null> {
    return this.upsert(id, options, requestOptions);
  }

  /**
   * Edits or creates an overwrite for a role or member.
   *
   * @param id - The role or member ID.
   * @param options - Permission states to apply.
   * @param requestOptions - Overwrite type and audit-log options.
   * @returns The channel after the request is accepted.
   */
  public edit(
    id: string,
    options: PermissionOverwriteOptions,
    requestOptions?: PermissionOverwriteRequestOptions,
  ): Promise<PermissionOverwriteChannel | null> {
    return this.upsert(id, options, requestOptions);
  }

  /**
   * Deletes an overwrite for a role or member.
   *
   * @param id - The role or member ID.
   * @param reason - Optional audit-log reason.
   * @returns The channel after the request is accepted.
   */
  public async delete(id: string, reason?: string): Promise<PermissionOverwriteChannel | null> {
    await this.channel.deletePermissionOverwrite(id, reason);
    this._cache.delete(id);
    return this.channel;
  }

  /**
   * Gets the overwrite cache.
   *
   * @returns The overwrite cache.
   */
  public get cache(): Cache<string, PermissionOverwriteStructureInstance> {
    return this._cache;
  }

  /**
   * Creates or replaces one overwrite through Discord's official endpoint.
   */
  private async upsert(
    id: string,
    options: PermissionOverwriteOptions,
    requestOptions?: PermissionOverwriteRequestOptions,
  ): Promise<PermissionOverwriteChannel | null> {
    const existing = this._cache.get(id);
    const allow = new PermissionsBitField(existing?.allow ?? PermissionsBitField.Default);
    const deny = new PermissionsBitField(existing?.deny ?? PermissionsBitField.Default);

    for (const [permission, value] of Object.entries(options) as Array<
      [keyof typeof PermissionFlagsBits, boolean | null]
    >) {
      if (value === true) {
        allow.add(permission as PermissionResolvable);
        deny.remove(permission as PermissionResolvable);
      } else if (value === false) {
        allow.remove(permission as PermissionResolvable);
        deny.add(permission as PermissionResolvable);
      } else {
        allow.remove(permission as PermissionResolvable);
        deny.remove(permission as PermissionResolvable);
      }
    }

    const type = requestOptions?.type ?? existing?.type ?? this.resolveType(id);
    const body: RESTPutAPIChannelPermissionJSONBody = {
      type,
      allow: allow.toJSON(),
      deny: deny.toJSON(),
    };
    await this.channel.editPermissionOverwrite(id, body, requestOptions?.reason);
    this._add(
      {
        id,
        type,
        allow: allow.toJSON(),
        deny: deny.toJSON(),
      },
      true,
    );
    return this.channel;
  }

  /**
   * Resolves a best-effort overwrite type from the existing client caches.
   */
  private resolveType(id: string): OverwriteType {
    return this.client.roles.get(id) ? OverwriteType.Role : OverwriteType.Member;
  }
}
