import type { GatewayThreadMembersUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class ThreadMembersStructure<
  T extends GatewayThreadMembersUpdateDispatchData = GatewayThreadMembersUpdateDispatchData,
> {
  public readonly client: Client;
  public readonly threadId: string;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.client = client;
    this.threadId = data.id;
  }
}

export default ThreadMembersStructure as new <
  T extends GatewayThreadMembersUpdateDispatchData = GatewayThreadMembersUpdateDispatchData,
>(
  data: T,
  client: Client,
) => ThreadMembersStructure<T> & T & { readonly threadId: string; readonly client: Client };

export type ThreadMembersStructureInstance = ThreadMembersStructure &
  GatewayThreadMembersUpdateDispatchData & { readonly threadId: string; readonly client: Client };
