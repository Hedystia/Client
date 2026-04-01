import type { APIChannel, APIMessage, APIUser } from "discord-api-types/v10";
import type Client from "../client";
import type { InteractionCollectorOptions } from "../collectors/InteractionCollector";
import InteractionCollector from "../collectors/InteractionCollector";
import type { ReactionCollectorOptions } from "../collectors/ReactionCollector";
import ReactionCollector from "../collectors/ReactionCollector";
import type { ChannelStructureInstance } from "./ChannelStructure";
import ChannelStructure from "./ChannelStructure";

class MessageStructure<T extends APIMessage = APIMessage> {
  public readonly channelId: string;
  public readonly guildId: string | null;
  public readonly client: Client;

  constructor(data: T, channelId: string, guildId: string | null, client: Client) {
    Object.assign(this, data);
    this.channelId = channelId;
    this.guildId = guildId;
    this.client = client;
  }

  /**
   * The message's mention
   */
  public get mention(): string {
    const message = this as unknown as APIMessage;
    return `https://discord.com/channels/${this.guildId ?? "@me"}/${this.channelId}/${message.id}`;
  }

  /**
   * The message's author
   */
  public get author(): APIUser | undefined {
    const message = this as unknown as APIMessage;
    return message.author;
  }

  /**
   * Whether the message is from the current user
   */
  public get isFromCurrentUser(): boolean {
    const message = this as unknown as APIMessage;
    return message.author?.id === this.client.me?.id;
  }

  /**
   * Whether the message is a crossposted message
   */
  public get isCrossposted(): boolean {
    const message = this as unknown as APIMessage;
    return Boolean((message.flags ?? 0) & (1 << 1));
  }

  /**
   * Whether the message is an automatic moderation action
   */
  public get isAutomaticModerationAction(): boolean {
    const message = this as unknown as APIMessage;
    return Boolean((message.flags ?? 0) & (1 << 6));
  }

  /**
   * The timestamp the message was created at
   */
  public get createdTimestamp(): number {
    const message = this as unknown as APIMessage;
    return Number((BigInt(message.id) >> 22n) + 1420070400000n);
  }

  /**
   * The date the message was created at
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * The timestamp the message was edited at
   */
  public get editedTimestamp(): number | null {
    const message = this as unknown as APIMessage;
    return message.edited_timestamp ? new Date(message.edited_timestamp).getTime() : null;
  }

  /**
   * The date the message was edited at
   */
  public get editedAt(): Date | null {
    const message = this as unknown as APIMessage;
    return message.edited_timestamp ? new Date(message.edited_timestamp) : null;
  }

  /**
   * Whether the message is editable
   */
  public get isEditable(): boolean {
    return this.isFromCurrentUser && !this.editedAt;
  }

  /**
   * Whether the message is deletable
   */
  public get isDeletable(): boolean {
    return this.isFromCurrentUser || this.guildId !== null;
  }

  /**
   * Whether the message is pinnable
   */
  public get isPinnable(): boolean {
    const message = this as unknown as APIMessage & { system?: boolean };
    return !message.system;
  }

  /**
   * Checks if this message equals another message
   * @param message - The message to compare with
   * @returns Whether the messages are equal
   */
  public equals(message: MessageStructureInstance): boolean {
    const messageA = this as unknown as APIMessage;
    const messageB = message as unknown as APIMessage;
    return messageA.id === messageB.id && this.channelId === message.channelId;
  }

  /**
   * Checks if this message is from a guild
   */
  public get isGuild(): boolean {
    return this.guildId !== null;
  }

  /**
   * Checks if this message is from a DM
   */
  public get isDM(): boolean {
    return this.guildId === null;
  }

  /**
   * Checks if the message has embeds
   */
  public get hasEmbeds(): boolean {
    const message = this as unknown as APIMessage;
    return (message.embeds?.length ?? 0) > 0;
  }

  /**
   * Checks if the message has attachments
   */
  public get hasAttachments(): boolean {
    const message = this as unknown as APIMessage;
    return (message.attachments?.length ?? 0) > 0;
  }

  /**
   * Checks if the message has reactions
   */
  public get hasReactions(): boolean {
    const message = this as unknown as APIMessage;
    return (message.reactions?.length ?? 0) > 0;
  }

  /**
   * Checks if the message mentions everyone
   */
  public get mentionsEveryone(): boolean {
    const message = this as unknown as APIMessage;
    return message.mention_everyone ?? false;
  }

  /**
   * Checks if the message mentions a role
   * @param roleId - The role id to check
   * @returns Whether the message mentions the role
   */
  public mentionsRole(roleId: string): boolean {
    const message = this as unknown as APIMessage;
    return (message.mention_roles ?? []).includes(roleId);
  }

  /**
   * Checks if the message mentions a user
   * @param userId - The user id to check
   * @returns Whether the message mentions the user
   */
  public mentionsUser(userId: string): boolean {
    const message = this as unknown as APIMessage;
    return (message.mentions ?? []).some((m) => m.id === userId);
  }

  /**
   * Checks if the message mentions a channel
   * @param channelId - The channel id to check
   * @returns Whether the message mentions the channel
   */
  public mentionsChannel(channelId: string): boolean {
    const message = this as unknown as APIMessage;
    return (message.mention_channels ?? []).some((c) => c.id === channelId);
  }

  /**
   * Creates a reaction collector on this message
   * @param options - Collector options
   * @returns A new reaction collector
   */
  public createReactionCollector(
    options?: Omit<ReactionCollectorOptions, "messageId">,
  ): ReactionCollector {
    const message = this as unknown as APIMessage & { id: string };
    return new ReactionCollector(this.client, {
      ...options,
      messageId: message.id,
      channelId: this.channelId,
      guildId: this.guildId ?? undefined,
    });
  }

  /**
   * Creates an interaction collector on this message for buttons and select menus
   * @param options - Collector options
   * @returns A new interaction collector
   */
  public createMessageComponentCollector(
    options?: Omit<InteractionCollectorOptions, "messageId">,
  ): InteractionCollector {
    const message = this as unknown as APIMessage & { id: string };
    return new InteractionCollector(this.client, {
      ...options,
      messageId: message.id,
    });
  }

  /**
   * Creates a button collector on this message
   * @param customId - The button's custom ID to filter
   * @param options - Collector options
   * @returns A new interaction collector for buttons
   */
  public createButtonCollector(
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType" | "messageId">,
  ): InteractionCollector {
    const message = this as unknown as APIMessage & { id: string };
    return InteractionCollector.createButtonCollector(this.client, customId, {
      ...options,
      messageId: message.id,
    });
  }

  /**
   * Creates a select menu collector on this message
   * @param customId - The select menu's custom ID to filter
   * @param options - Collector options
   * @returns A new interaction collector for select menus
   */
  public createSelectMenuCollector(
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType" | "messageId">,
  ): InteractionCollector {
    const message = this as unknown as APIMessage & { id: string };
    return InteractionCollector.createSelectMenuCollector(this.client, customId, {
      ...options,
      messageId: message.id,
    });
  }

  /**
   * Reacts to the message with an emoji
   * @param emoji - The emoji to react with
   * @returns A promise that resolves when the reaction is added
   */
  public async react(emoji: string): Promise<void> {
    const message = this as unknown as APIMessage;
    await this.client.rest.put(
      `/channels/${this.channelId}/messages/${message.id}/reactions/${encodeURIComponent(emoji)}/@me`,
    );
  }

  /**
   * Replies to the message
   * @param content - The content to send
   * @returns A promise that resolves to the sent message
   */
  public async reply(
    content:
      | string
      | {
          content?: string;
          embeds?: Array<{ title?: string; description?: string; color?: number }>;
        },
  ): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const body = typeof content === "string" ? { content } : content;

    const replyMessage = (await this.client.rest.post(`/channels/${this.channelId}/messages`, {
      body: {
        ...body,
        message_reference: {
          message_id: message.id,
          channel_id: this.channelId,
          guild_id: this.guildId ?? undefined,
        },
      },
    })) as APIMessage | null;

    if (!replyMessage) {
      return null;
    }

    return new MessageStructure(
      replyMessage,
      this.channelId,
      this.guildId,
      this.client,
    ) as unknown as MessageStructureInstance;
  }

  /**
   * Edits the message
   * @param content - The new content
   * @returns A promise that resolves to the edited message
   */
  public async edit(
    content:
      | string
      | {
          content?: string;
          embeds?: Array<{ title?: string; description?: string; color?: number }>;
        },
  ): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const body = typeof content === "string" ? { content } : content;

    const editedMessage = (await this.client.rest.patch(
      `/channels/${this.channelId}/messages/${message.id}`,
      {
        body,
      },
    )) as APIMessage | null;

    if (!editedMessage) {
      return null;
    }

    return new MessageStructure(
      editedMessage,
      this.channelId,
      this.guildId,
      this.client,
    ) as unknown as MessageStructureInstance;
  }

  /**
   * Deletes the message
   * @returns A promise that resolves when the message is deleted
   */
  public async delete(): Promise<void> {
    const message = this as unknown as APIMessage;
    await this.client.rest.delete(`/channels/${this.channelId}/messages/${message.id}`);
  }

  /**
   * Pins the message
   * @returns A promise that resolves when the message is pinned
   */
  public async pin(): Promise<void> {
    const message = this as unknown as APIMessage;
    await this.client.rest.put(`/channels/${this.channelId}/pins/${message.id}`);
  }

  /**
   * Unpins the message
   * @returns A promise that resolves when the message is unpinned
   */
  public async unpin(): Promise<void> {
    const message = this as unknown as APIMessage;
    await this.client.rest.delete(`/channels/${this.channelId}/pins/${message.id}`);
  }

  /**
   * Fetches the message (refetches from API)
   * @returns A promise that resolves to the fetched message
   */
  public async fetch(): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const fetchedMessage = (await this.client.rest.get(
      `/channels/${this.channelId}/messages/${message.id}`,
    )) as APIMessage | null;

    if (!fetchedMessage) {
      return null;
    }

    return new MessageStructure(
      fetchedMessage,
      this.channelId,
      this.guildId,
      this.client,
    ) as unknown as MessageStructureInstance;
  }

  /**
   * Crossposts the message (for news channels)
   * @returns A promise that resolves to the crossposted message
   */
  public async crosspost(): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const crosspostedMessage = (await this.client.rest.post(
      `/channels/${this.channelId}/messages/${message.id}/crosspost`,
    )) as APIMessage | null;

    if (!crosspostedMessage) {
      return null;
    }

    return new MessageStructure(
      crosspostedMessage,
      this.channelId,
      this.guildId,
      this.client,
    ) as unknown as MessageStructureInstance;
  }

  /**
   * Starts a thread from this message
   * @param name - The name of the thread
   * @param autoArchiveDuration - The auto archive duration in minutes
   * @returns A promise that resolves to the created thread
   */
  public async startThread(
    name: string,
    autoArchiveDuration?: 60 | 1440 | 4320 | 10080,
  ): Promise<ChannelStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const thread = (await this.client.rest.post(
      `/channels/${this.channelId}/messages/${message.id}/threads`,
      {
        body: {
          name,
          auto_archive_duration: autoArchiveDuration ?? 1440,
        },
      },
    )) as APIChannel | null;

    if (!thread) {
      return null;
    }

    return new ChannelStructure(thread, this.client) as unknown as ChannelStructureInstance;
  }
}

export default MessageStructure as new <T extends APIMessage = APIMessage>(
  data: T,
  channelId: string,
  guildId: string | null,
  client: Client,
) => MessageStructure<T> &
  T & { readonly channelId: string; readonly guildId: string | null; readonly client: Client };

export type MessageStructureInstance = InstanceType<typeof MessageStructure> &
  APIMessage & {
    readonly channelId: string;
    readonly guildId: string | null;
    readonly client: Client;
  };
