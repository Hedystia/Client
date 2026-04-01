import type { APISubscription } from "discord-api-types/v10";
import type Client from "../client";
import type { SubscriptionStructureInstance } from "../structures/SubscriptionStructure";
import SubscriptionStructure from "../structures/SubscriptionStructure";
import Cache from "../utils/cache";

export default class SubscriptionManager {
  client: Client;
  private readonly _cache = new Cache<string, SubscriptionStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

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

  public _remove(id: string): void {
    this._cache.delete(id);
  }

  public get(id: string): SubscriptionStructureInstance | undefined {
    return this._cache.get(id);
  }

  public async fetch(
    userId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<SubscriptionStructureInstance[]> {
    const cached: SubscriptionStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const subscription of this._cache.values()) {
        if (subscription.userId === userId) {
          cached.push(subscription);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const subscriptions = (await this.client.rest.get(`/users/${userId}/subscriptions`)) as
      | APISubscription[]
      | null;

    if (!subscriptions) {
      return cached;
    }

    return subscriptions.map((subscription) => {
      const subscriptionStructure = new SubscriptionStructure(subscription, this.client);
      this._add(subscriptionStructure, { enabled: true, force: false });
      return subscriptionStructure;
    });
  }

  public get cache(): Cache<string, SubscriptionStructureInstance> {
    return this._cache;
  }
}
