import type {
  APIChannel,
  APIGuildMember,
  APIMessage,
  RESTGetAPIChannelMessageReactionUsersQuery,
  RESTGetAPIChannelMessageReactionUsersResult,
  RESTGetAPIPollAnswerVotersQuery,
  RESTGetAPIPollAnswerVotersResult,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessagesThreadsJSONBody,
  RESTPostAPIPollExpireResult,
  ThreadAutoArchiveDuration,
} from "discord-api-types/v10";
import { MessageFlags, MessageReferenceType } from "discord-api-types/v10";
import type Client from "../client";
import type { InteractionCollectorOptions } from "../collectors/InteractionCollector";
import InteractionCollector from "../collectors/InteractionCollector";
import type { ReactionCollectorOptions } from "../collectors/ReactionCollector";
import ReactionCollector from "../collectors/ReactionCollector";
import { ChannelType, Routes } from "../utils/constants";
import type { ChannelStructureInstance } from "./ChannelStructure";
import ChannelStructure from "./ChannelStructure";
import type { MemberStructureInstance } from "./MemberStructure";
import MemberStructure from "./MemberStructure";
import type { UserStructureInstance } from "./UserStructure";
import UserStructure from "./UserStructure";
import type { WebhookStructureInstance } from "./WebhookStructure";

class MessageStructure<T extends APIMessage = APIMessage> {
  public readonly channelId: string;
  public readonly guildId: string | null;
  public readonly client: Client;
  private readonly payload: T;

  constructor(data: T, channelId: string, guildId: string | null, client: Client) {
    this.payload = data;
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.channelId = channelId;
    this.guildId = guildId;
    this.client = client;
    client.messages.set(data.id, this as unknown as MessageStructureInstance);
  }

  /**
   * The URL of the message on Discord.
   * @returns The message URL.
   */
  public get url(): string {
    const message = this as unknown as APIMessage;
    return `https://discord.com/channels/${this.guildId ?? "@me"}/${this.channelId}/${message.id}`;
  }

  /**
   * The message URL, retained as the library's historical mention alias.
   * @returns The message URL.
   */
  public get mention(): string {
    return this.url;
  }

  /**
   * The user who authored this message.
   *
   * The wrapper preserves the official user fields while exposing client-backed
   * helpers such as `send()` and `avatarURL()`.
   * @returns The message author as a user structure.
   */
  public get author(): UserStructureInstance {
    const message = this.payload;
    const cached = this.client.users.cache.get(message.author.id);
    if (cached) {
      return cached;
    }
    const structure = new UserStructure(message.author, this.client) as UserStructureInstance;
    this.client.users._add(structure, { enabled: true, force: false });
    return structure;
  }

  /**
   * The author's guild member data, when Discord included it.
   * @returns The client-backed member structure, or undefined in direct messages.
   */
  public get member(): MemberStructureInstance | undefined {
    const message = this.payload as T & { member?: APIGuildMember };
    if (!this.guildId || !message.member) {
      return undefined;
    }
    return new MemberStructure(
      message.member as APIGuildMember,
      this.guildId,
      this.client,
    ) as MemberStructureInstance;
  }

  /**
   * The channel containing this message.
   *
   * If the channel is not cached, a minimal official Discord partial channel is
   * created so calls such as `message.channel.send()` remain usable.
   * @returns The cached or minimally reconstructed channel structure.
   */
  public get channel(): ChannelStructureInstance {
    const channel = this.client.channels.get(this.channelId);
    if (channel) {
      return channel;
    }

    const partialChannel = {
      id: this.channelId,
      type: this.guildId === null ? ChannelType.DM : ChannelType.GuildText,
    } as APIChannel;
    const structure = new ChannelStructure(
      partialChannel,
      this.client,
    ) as unknown as ChannelStructureInstance;
    this.client.channels.set(this.channelId, structure);
    return structure;
  }

  /**
   * The thread created from this message, when Discord included it.
   * @returns The cached or reconstructed thread, or null when no thread exists.
   */
  public get thread(): ChannelStructureInstance | null {
    const thread = this.payload.thread;
    if (!thread) {
      return null;
    }
    const cached = this.client.channels.get(thread.id);
    if (cached) {
      return cached;
    }
    const structure = new ChannelStructure(
      thread,
      this.client,
    ) as unknown as ChannelStructureInstance;
    this.client.channels.set(thread.id, structure);
    return structure;
  }

  /**
   * Whether this message has an associated thread.
   */
  public get hasThread(): boolean {
    return (
      this.payload.thread !== undefined || Boolean(this.payload.flags && this.payload.flags & 32)
    );
  }

  /**
   * Fetches the thread associated with this message.
   * @returns The thread, or null when this message has no thread or Discord returned no data.
   */
  public async fetchThread(): Promise<ChannelStructureInstance | null> {
    const thread = this.thread;
    return thread ? thread.fetch() : null;
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
    return this.isFromCurrentUser;
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
      Routes.channelMessageOwnReaction(this.channelId, message.id, encodeURIComponent(emoji)),
    );
  }

  /**
   * Removes a reaction from this message.
   *
   * @param emoji - The emoji to remove.
   * @param userId - The user whose reaction should be removed, or omitted for the current user.
   * @returns A promise that resolves when Discord accepts the request.
   */
  public async removeReaction(emoji: string, userId?: string): Promise<void> {
    const message = this as unknown as APIMessage;
    const encodedEmoji = encodeURIComponent(emoji);
    const route = userId
      ? Routes.channelMessageUserReaction(this.channelId, message.id, encodedEmoji, userId)
      : Routes.channelMessageOwnReaction(this.channelId, message.id, encodedEmoji);
    await this.client.rest.delete(route);
  }

  /**
   * Removes every reaction from this message.
   *
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/channel#delete-all-reactions
   */
  public async removeAllReactions(): Promise<void> {
    const message = this as unknown as APIMessage;
    await this.client.rest.delete(Routes.channelMessageAllReactions(this.channelId, message.id));
  }

  /**
   * Removes every reaction for one emoji from this message.
   *
   * @param emoji - The emoji whose reactions should be removed.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/channel#delete-all-reactions-for-emoji
   */
  public async removeReactionEmoji(emoji: string): Promise<void> {
    const message = this as unknown as APIMessage;
    await this.client.rest.delete(
      Routes.channelMessageReaction(this.channelId, message.id, encodeURIComponent(emoji)),
    );
  }

  /**
   * Fetches the users who reacted with an emoji.
   *
   * @param emoji - The emoji to inspect.
   * @param options - The official Discord reaction-user query fields.
   * @returns The users returned by Discord.
   * @see https://docs.discord.com/developers/resources/channel#get-reactions
   */
  public async fetchReactionUsers(
    emoji: string,
    options?: RESTGetAPIChannelMessageReactionUsersQuery,
  ): Promise<RESTGetAPIChannelMessageReactionUsersResult> {
    const message = this as unknown as APIMessage;
    const query = options
      ? Object.fromEntries(Object.entries(options).map(([key, value]) => [key, String(value)]))
      : undefined;
    return (await this.client.rest.get(
      Routes.channelMessageReaction(this.channelId, message.id, encodeURIComponent(emoji)),
      { query },
    )) as RESTGetAPIChannelMessageReactionUsersResult;
  }

  /**
   * Fetches the users who voted for one poll answer.
   *
   * @param answerId - The poll answer ID.
   * @param options - The official poll-voter query fields.
   * @returns The users returned by Discord.
   * @see https://docs.discord.com/developers/resources/poll#get-answer-voters
   */
  public async fetchPollAnswerVoters(
    answerId: number,
    options?: RESTGetAPIPollAnswerVotersQuery,
  ): Promise<RESTGetAPIPollAnswerVotersResult> {
    const message = this as unknown as APIMessage;
    const query = options
      ? Object.fromEntries(
          Object.entries(options)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined;
    return (await this.client.rest.get(
      Routes.pollAnswerVoters(this.channelId, message.id, answerId),
      { query },
    )) as RESTGetAPIPollAnswerVotersResult;
  }

  /**
   * Expires this message's poll immediately.
   *
   * @returns The updated message, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/poll#expire-poll
   */
  public async expirePoll(): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const expiredMessage = (await this.client.rest.post(
      Routes.expirePoll(this.channelId, message.id),
    )) as RESTPostAPIPollExpireResult | null;
    if (!expiredMessage) {
      return null;
    }
    return new MessageStructure(
      expiredMessage,
      this.channelId,
      this.guildId,
      this.client,
    ) as unknown as MessageStructureInstance;
  }

  /**
   * Replies to the message
   * @param content - The content to send
   * @returns A promise that resolves to the sent message
   */
  public async reply(
    content: string | RESTPostAPIChannelMessageJSONBody | FormData,
  ): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const body = typeof content === "string" ? { content } : content;
    const messageReference = {
      message_id: message.id,
      channel_id: this.channelId,
      guild_id: this.guildId ?? undefined,
    };
    const replyBody =
      body instanceof FormData
        ? withMultipartMessageReference(body, messageReference)
        : { ...body, message_reference: messageReference };

    const replyMessage = (await this.client.rest.post(Routes.channelMessages(this.channelId), {
      body: replyBody,
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
    content: string | RESTPatchAPIChannelMessageJSONBody | FormData,
  ): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const body = typeof content === "string" ? { content } : content;

    const editedMessage = (await this.client.rest.patch(
      Routes.channelMessage(this.channelId, message.id),
      { body },
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
    await this.client.rest.delete(Routes.channelMessage(this.channelId, message.id));
  }

  /**
   * Suppresses or restores embeds on this message.
   * @param suppress - Whether embeds should be suppressed.
   * @returns The edited message, or null when Discord returned no data.
   */
  public suppressEmbeds(suppress = true): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const flags = message.flags ?? 0;
    return this.edit({
      flags: (suppress
        ? flags | MessageFlags.SuppressEmbeds
        : flags & ~MessageFlags.SuppressEmbeds) as RESTPatchAPIChannelMessageJSONBody["flags"],
    });
  }

  /**
   * Pins the message
   * @returns A promise that resolves when the message is pinned
   */
  public async pin(): Promise<void> {
    const message = this as unknown as APIMessage;
    await this.client.rest.put(Routes.channelMessagesPin(this.channelId, message.id));
  }

  /**
   * Unpins the message
   * @returns A promise that resolves when the message is unpinned
   */
  public async unpin(): Promise<void> {
    const message = this as unknown as APIMessage;
    await this.client.rest.delete(Routes.channelMessagesPin(this.channelId, message.id));
  }

  /**
   * Fetches the message (refetches from API)
   * @returns A promise that resolves to the fetched message
   */
  public async fetch(): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const fetchedMessage = (await this.client.rest.get(
      Routes.channelMessage(this.channelId, message.id),
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
      Routes.channelMessageCrosspost(this.channelId, message.id),
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
   * Fetches the webhook that created this message.
   *
   * @returns The webhook, or null when this message was not created by a webhook.
   * @see https://docs.discord.com/developers/resources/webhook#get-webhook
   */
  public fetchWebhook(): Promise<WebhookStructureInstance | null> {
    const message = this as unknown as APIMessage;
    return message.webhook_id
      ? this.client.webhooks.fetch(message.webhook_id)
      : Promise.resolve(null);
  }

  /**
   * Forwards this message to another channel.
   *
   * @param channel - The target channel ID or a channel structure.
   * @returns The forwarded message, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/message#forward-messages
   */
  public async forward(
    channel: string | ChannelStructureInstance,
  ): Promise<MessageStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const targetChannelId = typeof channel === "string" ? channel : channel.id;
    const targetGuildId =
      typeof channel === "string"
        ? null
        : ((channel as unknown as APIChannel & { guild_id?: string }).guild_id ?? null);
    const body: RESTPostAPIChannelMessageJSONBody = {
      message_reference: {
        type: MessageReferenceType.Forward,
        message_id: message.id,
        channel_id: this.channelId,
      },
    };
    const forwardedMessage = (await this.client.rest.post(Routes.channelMessages(targetChannelId), {
      body,
    })) as APIMessage | null;

    if (!forwardedMessage) {
      return null;
    }

    return new MessageStructure(
      forwardedMessage,
      targetChannelId,
      targetGuildId,
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
    autoArchiveDuration?: ThreadAutoArchiveDuration,
  ): Promise<ChannelStructureInstance | null> {
    const message = this as unknown as APIMessage;
    const thread = (await this.client.rest.post(Routes.threads(this.channelId, message.id), {
      body: {
        name,
        auto_archive_duration: autoArchiveDuration,
      } satisfies RESTPostAPIChannelMessagesThreadsJSONBody,
    })) as APIChannel | null;

    if (!thread) {
      return null;
    }

    return new ChannelStructure(thread, this.client) as unknown as ChannelStructureInstance;
  }
}

function withMultipartMessageReference(
  form: FormData,
  messageReference: {
    message_id: string;
    channel_id: string;
    guild_id?: string;
  },
): FormData {
  const result = new FormData();
  for (const [key, value] of form.entries()) {
    result.append(key, value);
  }

  const payload = form.get("payload_json");
  const data = typeof payload === "string" ? JSON.parse(payload) : {};
  result.set("payload_json", JSON.stringify({ ...data, message_reference: messageReference }));
  return result;
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
