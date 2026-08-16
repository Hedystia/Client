import type { APISKU, RESTGetAPISKUsResult } from "discord-api-types/v10";
import type Client from "../client";
import { Collection } from "../utils/Collection";
import { Routes } from "../utils/constants";

/**
 * Fetch options for application SKUs.
 */
export interface SkuFetchOptions {
  /** Whether to bypass the local SKU cache. */
  force?: boolean;
}

/**
 * Manages the SKUs belonging to the current application.
 *
 * Discord exposes SKUs as a list resource; individual SKU lookup is therefore
 * resolved from the cached or freshly fetched list.
 */
export default class SkuManager {
  /** The client instance that owns this manager. */
  public readonly client: Client;
  private readonly _cache = new Collection<string, APISKU>();

  /**
   * @param client - The client instance.
   */
  public constructor(client: Client) {
    this.client = client;
  }

  private applicationId(): string {
    const applicationId = this.client.me?.id;
    if (!applicationId) {
      throw new Error("Client is not logged in");
    }
    return applicationId;
  }

  /**
   * Fetches all SKUs belonging to the current application.
   *
   * @param options - Cache options.
   * @returns A collection of official Discord SKU payloads.
   * @see https://docs.discord.com/developers/resources/sku#list-skus
   */
  public async fetch(options?: SkuFetchOptions): Promise<Collection<string, APISKU>> {
    if (!options?.force && this._cache.size > 0) {
      return this._cache;
    }

    const skus = (await this.client.rest.get(
      Routes.skus(this.applicationId()),
    )) as RESTGetAPISKUsResult | null;
    this._cache.clear();
    for (const sku of skus ?? []) {
      this._cache.set(sku.id, sku);
    }
    return this._cache;
  }

  /**
   * Fetches one SKU from the current application's SKU list.
   *
   * @param skuId - The SKU ID.
   * @param options - Cache options.
   * @returns The official SKU payload, or null when it was not found.
   */
  public async fetchOne(skuId: string, options?: SkuFetchOptions): Promise<APISKU | null> {
    const skus = await this.fetch(options);
    return skus.get(skuId) ?? null;
  }

  /**
   * Gets the locally cached SKUs.
   * @returns The SKU cache.
   */
  public get cache(): Collection<string, APISKU> {
    return this._cache;
  }
}
