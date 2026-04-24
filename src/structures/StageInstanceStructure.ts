import type { APIStageInstance } from "discord-api-types/v10";
import type Client from "../client";

class StageInstanceStructure<T extends APIStageInstance = APIStageInstance> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }

  public get id(): string {
    return (this as unknown as APIStageInstance).id;
  }

  public get channelId(): string {
    return (this as unknown as APIStageInstance).channel_id;
  }

  public get guildId(): string {
    return (this as unknown as APIStageInstance).guild_id;
  }

  public get topic(): string {
    return (this as unknown as APIStageInstance).topic;
  }
}

export default StageInstanceStructure as new <T extends APIStageInstance = APIStageInstance>(
  data: T,
  client: Client,
) => StageInstanceStructure<T> & T & { readonly client: Client };

export type StageInstanceStructureInstance = StageInstanceStructure &
  APIStageInstance & { readonly client: Client };
