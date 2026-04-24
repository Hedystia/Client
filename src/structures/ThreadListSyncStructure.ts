import type { GatewayThreadListSyncDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class ThreadListSyncStructure<
  T extends GatewayThreadListSyncDispatchData = GatewayThreadListSyncDispatchData,
> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }

  public get guildId(): string {
    return (this as unknown as GatewayThreadListSyncDispatchData).guild_id;
  }

  public get channelIds(): string[] | undefined {
    return (this as unknown as GatewayThreadListSyncDispatchData).channel_ids;
  }

  public get threads(): Array<{ id: string; type: number; name: string; parent_id?: string }> {
    return (this as unknown as GatewayThreadListSyncDispatchData).threads;
  }

  public get members(): unknown {
    return (this as unknown as GatewayThreadListSyncDispatchData).members;
  }
}

export default ThreadListSyncStructure as new <
  T extends GatewayThreadListSyncDispatchData = GatewayThreadListSyncDispatchData,
>(
  data: T,
  client: Client,
) => ThreadListSyncStructure<T> & T & { readonly client: Client };

export type ThreadListSyncStructureInstance = ThreadListSyncStructure &
  GatewayThreadListSyncDispatchData & { readonly client: Client };
