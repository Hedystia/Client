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
}

export default MessagePollVoteStructure as new <
  T extends GatewayMessagePollVoteDispatchData = GatewayMessagePollVoteDispatchData,
>(
  data: T,
  client: Client,
) => MessagePollVoteStructure<T> & T & { readonly client: Client };

export type MessagePollVoteStructureInstance = MessagePollVoteStructure &
  GatewayMessagePollVoteDispatchData & { readonly client: Client };
