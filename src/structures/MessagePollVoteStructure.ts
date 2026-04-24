import type { GatewayMessagePollVoteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class MessagePollVoteStructure<
  T extends GatewayMessagePollVoteDispatchData = GatewayMessagePollVoteDispatchData,
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

  public get userId(): string | null {
    return (this as unknown as GatewayMessagePollVoteDispatchData).user_id ?? null;
  }

  public get channelId(): string {
    return (this as unknown as GatewayMessagePollVoteDispatchData).channel_id;
  }

  public get messageId(): string {
    return (this as unknown as GatewayMessagePollVoteDispatchData).message_id;
  }

  public get guildId(): string | null {
    return (this as unknown as GatewayMessagePollVoteDispatchData).guild_id ?? null;
  }

  public get answerId(): number {
    return (this as unknown as GatewayMessagePollVoteDispatchData).answer_id;
  }
}

export default MessagePollVoteStructure as new <
  T extends GatewayMessagePollVoteDispatchData = GatewayMessagePollVoteDispatchData,
>(
  data: T,
  client: Client,
) => MessagePollVoteStructure<T> & T & { readonly client: Client };

export type MessagePollVoteStructureInstance = MessagePollVoteStructure &
  GatewayMessagePollVoteDispatchData & { readonly client: Client };
