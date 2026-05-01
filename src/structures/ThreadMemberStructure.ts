import type { APIThreadMember } from "discord-api-types/v10";
import type Client from "../client";

class ThreadMemberStructure<T extends APIThreadMember = APIThreadMember> {
  public readonly client: Client;
  public readonly threadId: string;
  public readonly guildId: string;

  constructor(data: T, threadId: string, guildId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.threadId = threadId;
    this.guildId = guildId;
    this.client = client;
  }
}

export default ThreadMemberStructure as new <T extends APIThreadMember = APIThreadMember>(
  data: T,
  threadId: string,
  guildId: string,
  client: Client,
) => ThreadMemberStructure<T> &
  T & { readonly threadId: string; readonly guildId: string; readonly client: Client };

export type ThreadMemberStructureInstance = ThreadMemberStructure &
  APIThreadMember & {
    readonly threadId: string;
    readonly guildId: string;
    readonly client: Client;
  };
