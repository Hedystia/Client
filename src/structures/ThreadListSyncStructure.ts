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
}

export default ThreadListSyncStructure as new <
  T extends GatewayThreadListSyncDispatchData = GatewayThreadListSyncDispatchData,
>(
  data: T,
  client: Client,
) => ThreadListSyncStructure<T> & T & { readonly client: Client };

export type ThreadListSyncStructureInstance = ThreadListSyncStructure &
  GatewayThreadListSyncDispatchData & { readonly client: Client };
