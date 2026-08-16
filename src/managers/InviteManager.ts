import type {
  GatewayInviteCreateDispatchData,
  RESTGetAPIInviteTargetUsersJobStatusResult,
} from "discord-api-types/v10";
import type Client from "../client";
import type { InviteStructureInstance } from "../structures/InviteStructure";
import InviteStructure from "../structures/InviteStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class InviteManager {
  client: Client;
  private readonly _cache = new Cache<string, InviteStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(data: InviteStructureInstance, cache: { enabled: boolean; force: boolean }): void {
    if (cache.enabled && data.code) {
      const invite = this._cache.get(data.code);
      if (invite && !cache.force) {
        return;
      }
      this._cache.set(data.code, data);
    }
  }

  public _remove(code: string): void {
    this._cache.delete(code);
  }

  public get(code: string): InviteStructureInstance | undefined {
    return this._cache.get(code);
  }

  public async fetch(
    code: string,
    options?: { cache?: { force: boolean }; withCounts?: boolean; withExpiration?: boolean },
  ): Promise<InviteStructureInstance | null> {
    const cached = this._cache.get(code);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const query = {
      ...(options?.withCounts !== undefined ? { with_counts: String(options.withCounts) } : {}),
      ...(options?.withExpiration !== undefined
        ? { with_expiration: String(options.withExpiration) }
        : {}),
    };
    const invite = (await this.client.rest.get(Routes.invite(code), {
      query,
    })) as GatewayInviteCreateDispatchData | null;

    if (!invite) {
      return null;
    }

    const inviteStructure = new InviteStructure(invite, this.client);
    this._add(inviteStructure, { enabled: true, force: false });
    return inviteStructure;
  }

  public async delete(code: string, reason?: string): Promise<void> {
    await this.client.rest.delete(Routes.invite(code), { reason });
    this._remove(code);
  }

  /**
   * Downloads the CSV containing users allowed to accept an invite.
   */
  public async fetchTargetUsers(code: string): Promise<ArrayBuffer | null> {
    return this.client.rest.get(Routes.inviteTargetUsers(code), {
      responseType: "arrayBuffer",
    }) as Promise<ArrayBuffer | null>;
  }

  /**
   * Replaces the users allowed to accept an invite with a CSV file.
   */
  public async updateTargetUsers(code: string, file: Blob): Promise<void> {
    const form = new FormData();
    form.append("target_users_file", file);
    await this.client.rest.put(Routes.inviteTargetUsers(code), { body: form });
  }

  /**
   * Gets the asynchronous target-user import status for an invite.
   */
  public async fetchTargetUsersJobStatus(
    code: string,
  ): Promise<RESTGetAPIInviteTargetUsersJobStatusResult | null> {
    return this.client.rest.get(
      Routes.inviteTargetUsersJobStatus(code),
    ) as Promise<RESTGetAPIInviteTargetUsersJobStatusResult | null>;
  }

  public get cache(): Cache<string, InviteStructureInstance> {
    return this._cache;
  }
}
