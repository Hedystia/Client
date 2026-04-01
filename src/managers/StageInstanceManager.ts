import type { APIStageInstance } from "discord-api-types/v10";
import type Client from "../client";
import type { StageInstanceStructureInstance } from "../structures/StageInstanceStructure";
import StageInstanceStructure from "../structures/StageInstanceStructure";
import Cache from "../utils/cache";

export default class StageInstanceManager {
  client: Client;
  private readonly _cache = new Cache<string, StageInstanceStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(
    data: StageInstanceStructureInstance,
    cache: { enabled: boolean; force: boolean },
  ): void {
    if (cache.enabled && data.id) {
      const instance = this._cache.get(data.id);
      if (instance && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  public _remove(id: string): void {
    this._cache.delete(id);
  }

  public get(id: string): StageInstanceStructureInstance | undefined {
    return this._cache.get(id);
  }

  public async fetch(
    channelId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<StageInstanceStructureInstance | null> {
    const cached = Array.from(this._cache.values()).find(
      (instance) => instance.channelId === channelId,
    );
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const instance = (await this.client.rest.get(
      `/stage-instances/${channelId}`,
    )) as APIStageInstance | null;

    if (!instance) {
      return null;
    }

    const instanceStructure = new StageInstanceStructure(instance, this.client);
    this._add(instanceStructure, { enabled: true, force: false });
    return instanceStructure;
  }

  public get cache(): Cache<string, StageInstanceStructureInstance> {
    return this._cache;
  }
}
