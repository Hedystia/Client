import type { APIThreadMember } from "discord-api-types/v10";
import type Client from "../client";

class ThreadMemberStructure<T extends APIThreadMember = APIThreadMember> {
  public readonly client: Client;
  public readonly threadId: string;
  public readonly guildId: string;

  constructor(data: T, threadId: string, guildId: string, client: Client) {
    Object.assign(this, data);
    this.threadId = threadId;
    this.guildId = guildId;
    this.client = client;
  }

  public get userId(): string | undefined {
    return (this as unknown as APIThreadMember).user_id;
  }

  public get joinTimestamp(): string | undefined {
    return (this as unknown as APIThreadMember).join_timestamp;
  }

  public get flags(): number {
    return (this as unknown as APIThreadMember).flags ?? 0;
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
