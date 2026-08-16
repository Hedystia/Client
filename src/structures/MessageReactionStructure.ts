import type {
  APIUser,
  GatewayMessageReactionAddDispatchData,
  GatewayMessageReactionRemoveDispatchData,
  RESTGetAPIChannelMessageReactionUsersQuery,
  RESTGetAPIChannelMessageReactionUsersResult,
} from "discord-api-types/v10";
import type Client from "../client";
import { Routes } from "../utils/constants";
import type { MessageStructureInstance } from "./MessageStructure";
import type { UserStructureInstance } from "./UserStructure";
import UserStructure from "./UserStructure";

type MessageReactionData =
  | GatewayMessageReactionAddDispatchData
  | GatewayMessageReactionRemoveDispatchData;

class MessageReactionStructure<T extends MessageReactionData = MessageReactionData> {
  public readonly client: Client;
  public readonly messageId: string;
  public readonly channelId: string;

  constructor(data: T, messageId: string, channelId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.messageId = messageId;
    this.channelId = channelId;
    this.client = client;
  }

  public get count(): number {
    return (
      (this as unknown as GatewayMessageReactionRemoveDispatchData & { count?: number }).count ?? 0
    );
  }

  public get me(): boolean {
    return (
      (this as unknown as GatewayMessageReactionRemoveDispatchData & { me?: boolean }).me ?? false
    );
  }

  public get emoji(): GatewayMessageReactionRemoveDispatchData["emoji"] {
    return (this as unknown as GatewayMessageReactionRemoveDispatchData).emoji;
  }

  public get emojiName(): string | null {
    return this.emoji?.name ?? null;
  }

  public get emojiId(): string | null {
    return this.emoji?.id ?? null;
  }

  public get userId(): string {
    return (this as unknown as GatewayMessageReactionRemoveDispatchData).user_id;
  }

  public get identifier(): string {
    if (this.emojiId) {
      return `${this.emojiName}:${this.emojiId}`;
    }
    return this.emojiName ?? "";
  }

  /**
   * The cached message associated with this reaction.
   * @returns The message, or null when it is not cached.
   */
  public get message(): MessageStructureInstance | null {
    return this.client.messages.get(this.messageId) ?? null;
  }

  /**
   * Fetches users who reacted with this emoji.
   *
   * @param options - The official Discord reaction-user query fields.
   * @returns Client-backed user structures.
   * @see https://docs.discord.com/developers/resources/channel#get-reactions
   */
  public async fetchUsers(
    options?: RESTGetAPIChannelMessageReactionUsersQuery,
  ): Promise<UserStructureInstance[]> {
    const query = options
      ? Object.fromEntries(
          Object.entries(options)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined;
    const users = (await this.client.rest.get(
      Routes.channelMessageReaction(
        this.channelId,
        this.messageId,
        encodeURIComponent(this.identifier),
      ),
      { query },
    )) as RESTGetAPIChannelMessageReactionUsersResult;

    return users.map((user: APIUser) => {
      const cached = this.client.users.cache.get(user.id);
      if (cached) {
        return cached;
      }
      const structure = new UserStructure(user, this.client) as UserStructureInstance;
      this.client.users._add(structure, { enabled: true, force: false });
      return structure;
    });
  }

  /**
   * Removes a user's reaction from the message.
   *
   * @param userId - The user ID to remove, or omitted for the current user.
   * @returns A promise that resolves when Discord accepts the request.
   */
  public async remove(userId?: string): Promise<void> {
    const route = userId
      ? Routes.channelMessageUserReaction(
          this.channelId,
          this.messageId,
          encodeURIComponent(this.identifier),
          userId,
        )
      : Routes.channelMessageOwnReaction(
          this.channelId,
          this.messageId,
          encodeURIComponent(this.identifier),
        );
    await this.client.rest.delete(route);
  }
}

export default MessageReactionStructure as new <
  T extends MessageReactionData = MessageReactionData,
>(
  data: T,
  messageId: string,
  channelId: string,
  client: Client,
) => MessageReactionStructure<T> &
  T & { readonly messageId: string; readonly channelId: string; readonly client: Client };

export type MessageReactionStructureInstance = MessageReactionStructure &
  MessageReactionData & {
    readonly messageId: string;
    readonly channelId: string;
    readonly client: Client;
  };
