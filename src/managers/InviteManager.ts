import type { GatewayInviteCreateDispatchData } from "discord-api-types/v10";
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

    const query = new URLSearchParams();
    if (options?.withCounts) {
      query.set("with_counts", "true");
    }
    if (options?.withExpiration) {
      query.set("with_expiration", "true");
    }

    const invite = (await this.client.rest.get(
      `/invites/${code}?${query.toString()}`,
    )) as GatewayInviteCreateDispatchData | null;

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

  public get cache(): Cache<string, InviteStructureInstance> {
    return this._cache;
  }
}
