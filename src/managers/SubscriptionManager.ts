import type {
  RESTGetAPISKUSubscriptionResult,
  RESTGetAPISKUSubscriptionsQuery,
  RESTGetAPISKUSubscriptionsResult,
} from "discord-api-types/v10";
import type Client from "../client";
import type { SubscriptionStructureInstance } from "../structures/SubscriptionStructure";
import SubscriptionStructure from "../structures/SubscriptionStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

/** Library cache options combined with Discord's subscription query fields. */
export type SubscriptionFetchOptions = RESTGetAPISKUSubscriptionsQuery & {
  cache?: { force: boolean };
};

/**
 * Manages subscriptions for application SKUs.
 */
export default class SubscriptionManager {
  /** The client instance. */
  public readonly client: Client;
  private readonly _cache = new Cache<string, SubscriptionStructureInstance>();

  /**
   * Creates a subscription manager.
   *
   * @param client - The client instance.
   */
  public constructor(client: Client) {
    this.client = client;
  }

  /**
   * Adds a subscription structure to the cache.
   *
   * @param data - The subscription structure to cache.
   * @param cache - Cache behavior.
   */
  public _add(
    data: SubscriptionStructureInstance,
    cache: { enabled: boolean; force: boolean },
  ): void {
    if (cache.enabled && data.id) {
      const subscription = this._cache.get(data.id);
      if (subscription && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  /**
   * Removes a subscription from the cache.
   *
   * @param id - The subscription ID.
   */
  public _remove(id: string): void {
    this._cache.delete(id);
  }

  /**
   * Gets a cached subscription.
   *
   * @param id - The subscription ID.
   * @returns The cached subscription, if present.
   */
  public get(id: string): SubscriptionStructureInstance | undefined {
    return this._cache.get(id);
  }

  /**
   * Fetches subscriptions for an application SKU.
   *
   * @param skuId - The SKU ID.
   * @param options - Official Discord subscription query fields plus cache options.
   * @returns The fetched subscriptions.
   * @see https://docs.discord.com/developers/resources/subscription#list-sku-subscriptions
   */
  public async fetch(
    skuId: string,
    options?: SubscriptionFetchOptions,
  ): Promise<SubscriptionStructureInstance[]> {
    const cached: SubscriptionStructureInstance[] = [];
    if (!options?.cache?.force) {
      for (const subscription of this._cache.values()) {
        if (subscription.sku_ids.includes(skuId)) {
          cached.push(subscription);
        }
      }
      if (cached.length > 0 && Object.keys(options ?? {}).every((key) => key === "cache")) {
        return cached;
      }
    }

    const query = Object.fromEntries(
      Object.entries(options ?? {})
        .filter(([key, value]) => key !== "cache" && value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    const subscriptions = (await this.client.rest.get(Routes.skuSubscriptions(skuId), {
      query,
    })) as RESTGetAPISKUSubscriptionsResult | null;

    if (!subscriptions) {
      return cached;
    }

    return subscriptions.map((subscription) => {
      const structure = new SubscriptionStructure(subscription, this.client);
      this._add(structure, { enabled: true, force: true });
      return structure;
    });
  }

  /**
   * Fetches one subscription for an application SKU.
   *
   * @param skuId - The SKU ID.
   * @param subscriptionId - The subscription ID.
   * @returns The subscription, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/subscription#get-sku-subscription
   */
  public async fetchOne(
    skuId: string,
    subscriptionId: string,
  ): Promise<SubscriptionStructureInstance | null> {
    const subscription = (await this.client.rest.get(
      Routes.skuSubscription(skuId, subscriptionId),
    )) as RESTGetAPISKUSubscriptionResult | null;
    if (!subscription) {
      return null;
    }
    const structure = new SubscriptionStructure(subscription, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Gets the subscription cache.
   *
   * @returns The subscription cache.
   */
  public get cache(): Cache<string, SubscriptionStructureInstance> {
    return this._cache;
  }
}
