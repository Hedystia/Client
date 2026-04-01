import type { APIEntitlement } from "discord-api-types/v10";
import type Client from "../client";
import type { EntitlementStructureInstance } from "../structures/EntitlementStructure";
import EntitlementStructure from "../structures/EntitlementStructure";
import Cache from "../utils/cache";

export default class EntitlementManager {
  client: Client;
  private readonly _cache = new Cache<string, EntitlementStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(
    data: EntitlementStructureInstance,
    cache: { enabled: boolean; force: boolean },
  ): void {
    if (cache.enabled && data.id) {
      const entitlement = this._cache.get(data.id);
      if (entitlement && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  public _remove(id: string): void {
    this._cache.delete(id);
  }

  public get(id: string): EntitlementStructureInstance | undefined {
    return this._cache.get(id);
  }

  public async fetch(options?: {
    userId?: string;
    skuIds?: string[];
    cache?: { force: boolean };
  }): Promise<EntitlementStructureInstance[]> {
    const cached: EntitlementStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const entitlement of this._cache.values()) {
        cached.push(entitlement);
      }

      if (cached.length > 0 && !options?.userId && !options?.skuIds) {
        return cached;
      }
    }

    const query = new URLSearchParams();
    if (options?.userId) {
      query.set("user_id", options.userId);
    }
    if (options?.skuIds) {
      query.set("sku_ids", options.skuIds.join(","));
    }

    const entitlements = (await this.client.rest.get(
      `/applications/@me/entitlements?${query.toString()}`,
    )) as APIEntitlement[] | null;

    if (!entitlements) {
      return cached;
    }

    return entitlements.map((entitlement) => {
      const entitlementStructure = new EntitlementStructure(entitlement, this.client);
      this._add(entitlementStructure, { enabled: true, force: false });
      return entitlementStructure;
    });
  }

  public async consume(entitlementId: string): Promise<void> {
    await this.client.rest.post(`/applications/@me/entitlements/${entitlementId}/consume`);
  }

  public get cache(): Cache<string, EntitlementStructureInstance> {
    return this._cache;
  }
}
