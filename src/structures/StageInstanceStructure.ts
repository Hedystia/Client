import type { APIStageInstance, RESTPatchAPIStageInstanceJSONBody } from "discord-api-types/v10";
import type Client from "../client";

class StageInstanceStructure<T extends APIStageInstance = APIStageInstance> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }

  /**
   * Edits this stage instance.
   *
   * @param data - The official Discord stage-instance edit body.
   * @returns The edited instance, or null when Discord returned no data.
   */
  public edit(
    data: RESTPatchAPIStageInstanceJSONBody,
  ): Promise<StageInstanceStructureInstance | null> {
    const instance = this as unknown as APIStageInstance;
    return this.client.stageInstances.edit(instance.channel_id, data);
  }

  /**
   * Deletes this stage instance.
   *
   * @returns A promise that resolves when Discord accepts the request.
   */
  public delete(): Promise<void> {
    const instance = this as unknown as APIStageInstance;
    return this.client.stageInstances.delete(instance.channel_id);
  }
}

export default StageInstanceStructure as new <T extends APIStageInstance = APIStageInstance>(
  data: T,
  client: Client,
) => StageInstanceStructure<T> & T & { readonly client: Client };

export type StageInstanceStructureInstance = StageInstanceStructure &
  APIStageInstance & { readonly client: Client };
