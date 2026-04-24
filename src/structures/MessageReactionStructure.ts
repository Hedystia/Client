import type { GatewayMessageReactionAddDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class MessageReactionStructure<
  T extends GatewayMessageReactionAddDispatchData = GatewayMessageReactionAddDispatchData,
> {
  public readonly client: Client;
  public readonly messageId: string;
  public readonly channelId: string;

  constructor(data: T, messageId: string, channelId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.messageId = messageId;
    this.channelId = channelId;
    this.client = client;
  }

  public get count(): number {
    return (
      (this as unknown as GatewayMessageReactionAddDispatchData & { count?: number }).count ?? 0
    );
  }

  public get me(): boolean {
    return (
      (this as unknown as GatewayMessageReactionAddDispatchData & { me?: boolean }).me ?? false
    );
  }

  public get emoji(): GatewayMessageReactionAddDispatchData["emoji"] {
    return (this as unknown as GatewayMessageReactionAddDispatchData).emoji;
  }

  public get emojiName(): string | null {
    return this.emoji?.name ?? null;
  }

  public get emojiId(): string | null {
    return this.emoji?.id ?? null;
  }

  public get userId(): string {
    return (this as unknown as GatewayMessageReactionAddDispatchData).user_id;
  }

  public get identifier(): string {
    if (this.emojiId) {
      return `${this.emojiName}:${this.emojiId}`;
    }
    return this.emojiName ?? "";
  }
}

export default MessageReactionStructure as new <
  T extends GatewayMessageReactionAddDispatchData = GatewayMessageReactionAddDispatchData,
>(
  data: T,
  messageId: string,
  channelId: string,
  client: Client,
) => MessageReactionStructure<T> &
  T & { readonly messageId: string; readonly channelId: string; readonly client: Client };

export type MessageReactionStructureInstance = MessageReactionStructure &
  GatewayMessageReactionAddDispatchData & {
    readonly messageId: string;
    readonly channelId: string;
    readonly client: Client;
  };
