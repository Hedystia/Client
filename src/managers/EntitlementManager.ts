import type {
  APIEntitlement,
  RESTDeleteAPIEntitlementResult,
  RESTGetAPIEntitlementResult,
  RESTGetAPIEntitlementsQuery,
  RESTPostAPIEntitlementConsumeResult,
  RESTPostAPIEntitlementJSONBody,
  RESTPostAPIEntitlementResult,
} from "discord-api-types/v10";
import type Client from "../client";
import type { EntitlementStructureInstance } from "../structures/EntitlementStructure";
import EntitlementStructure from "../structures/EntitlementStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

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

  public async fetch(
    options?: RESTGetAPIEntitlementsQuery & { cache?: { force: boolean } },
  ): Promise<EntitlementStructureInstance[]> {
    const cached: EntitlementStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const entitlement of this._cache.values()) {
        cached.push(entitlement);
      }

      if (cached.length > 0 && Object.keys(options ?? {}).every((key) => key === "cache")) {
        return cached;
      }
    }

    const query = Object.fromEntries(
      Object.entries(options ?? {})
        .filter(([key, value]) => key !== "cache" && value !== undefined)
        .map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value)]),
    );
    const entitlements = (await this.client.rest.get(Routes.entitlements("@me"), {
      query,
    })) as APIEntitlement[] | null;

    if (!entitlements) {
      return cached;
    }

    return entitlements.map((entitlement) => {
      const entitlementStructure = new EntitlementStructure(entitlement, this.client);
      this._add(entitlementStructure, { enabled: true, force: false });
      return entitlementStructure;
    });
  }

  /**
   * Fetches one entitlement.
   *
   * @param entitlementId - The entitlement ID.
   * @returns The entitlement, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/entitlement#get-entitlement
   */
  public async fetchOne(entitlementId: string): Promise<EntitlementStructureInstance | null> {
    const entitlement = (await this.client.rest.get(
      Routes.entitlement("@me", entitlementId),
    )) as RESTGetAPIEntitlementResult | null;
    if (!entitlement) {
      return null;
    }
    const structure = new EntitlementStructure(entitlement, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Creates a test entitlement for the current application.
   *
   * @param data - The official Discord test-entitlement body.
   * @returns The created entitlement data.
   * @see https://docs.discord.com/developers/resources/entitlement#create-test-entitlement
   */
  public async create(data: RESTPostAPIEntitlementJSONBody): Promise<RESTPostAPIEntitlementResult> {
    const entitlement = (await this.client.rest.post(Routes.entitlements("@me"), {
      body: data,
    })) as RESTPostAPIEntitlementResult;
    if (entitlement.id) {
      const structure = new EntitlementStructure(entitlement as APIEntitlement, this.client);
      this._add(structure, { enabled: true, force: true });
    }
    return entitlement;
  }

  /**
   * Deletes a test entitlement.
   *
   * @param entitlementId - The entitlement ID.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/entitlement#delete-test-entitlement
   */
  public async delete(entitlementId: string): Promise<RESTDeleteAPIEntitlementResult> {
    await this.client.rest.delete(Routes.entitlement("@me", entitlementId));
    this._remove(entitlementId);
  }

  /**
   * Consumes an entitlement.
   *
   * @param entitlementId - The entitlement ID.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/entitlement#consume-an-entitlement
   */
  public async consume(entitlementId: string): Promise<RESTPostAPIEntitlementConsumeResult> {
    await this.client.rest.post(Routes.consumeEntitlement("@me", entitlementId));
    return undefined;
  }

  /**
   * Gets the entitlement cache.
   *
   * @returns The entitlement cache.
   */
  public get cache(): Cache<string, EntitlementStructureInstance> {
    return this._cache;
  }
}
