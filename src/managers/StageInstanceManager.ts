import type {
  APIStageInstance,
  RESTDeleteAPIStageInstanceResult,
  RESTPatchAPIStageInstanceJSONBody,
  RESTPostAPIStageInstanceJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import type { StageInstanceStructureInstance } from "../structures/StageInstanceStructure";
import StageInstanceStructure from "../structures/StageInstanceStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

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
      (instance) => instance.channel_id === channelId,
    );
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const instance = (await this.client.rest.get(
      Routes.stageInstance(channelId),
    )) as APIStageInstance | null;

    if (!instance) {
      return null;
    }

    const instanceStructure = new StageInstanceStructure(instance, this.client);
    this._add(instanceStructure, { enabled: true, force: false });
    return instanceStructure;
  }

  /**
   * Creates a stage instance for a stage channel.
   *
   * @param data - The official Discord stage-instance creation body.
   * @returns The created stage instance, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/stage-instance#create-stage-instance
   */
  public async create(
    data: RESTPostAPIStageInstanceJSONBody,
  ): Promise<StageInstanceStructureInstance | null> {
    const instance = (await this.client.rest.post(Routes.stageInstances(), {
      body: data,
    })) as APIStageInstance | null;
    if (!instance) {
      return null;
    }
    const structure = new StageInstanceStructure(instance, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Edits a stage instance.
   *
   * @param channelId - The stage channel ID.
   * @param data - The official Discord stage-instance edit body.
   * @returns The edited stage instance, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/stage-instance#modify-stage-instance
   */
  public async edit(
    channelId: string,
    data: RESTPatchAPIStageInstanceJSONBody,
  ): Promise<StageInstanceStructureInstance | null> {
    const instance = (await this.client.rest.patch(Routes.stageInstance(channelId), {
      body: data,
    })) as APIStageInstance | null;
    if (!instance) {
      return null;
    }
    const structure = new StageInstanceStructure(instance, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Deletes a stage instance.
   *
   * @param channelId - The stage channel ID.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/stage-instance#delete-stage-instance
   */
  public async delete(channelId: string): Promise<RESTDeleteAPIStageInstanceResult> {
    await this.client.rest.delete(Routes.stageInstance(channelId));
    this._remove(channelId);
  }

  /**
   * Gets the stage-instance cache.
   *
   * @returns The stage-instance cache.
   */
  public get cache(): Cache<string, StageInstanceStructureInstance> {
    return this._cache;
  }
}
