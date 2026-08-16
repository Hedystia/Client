import type {
  APIChannel,
  APIDMChannel,
  APIGroupDMChannel,
  APIGuildCategoryChannel,
  APIGuildVoiceChannel,
  APIMessage,
  APINewsChannel,
  APIOverwrite,
  APITextChannel,
  APIThreadChannel,
  RESTDeleteAPIChannelRecipientResult,
  RESTDeleteAPIChannelThreadMembersResult,
  RESTGetAPIChannelInvitesResult,
  RESTGetAPIChannelMessagesPinsQuery,
  RESTGetAPIChannelMessagesPinsResult,
  RESTGetAPIChannelMessagesQuery,
  RESTGetAPIChannelThreadMemberQuery,
  RESTGetAPIChannelThreadMemberResult,
  RESTGetAPIChannelThreadMembersQuery,
  RESTGetAPIChannelThreadMembersResult,
  RESTGetAPIChannelThreadsArchivedPrivateResult,
  RESTGetAPIChannelThreadsArchivedPublicResult,
  RESTGetAPIChannelThreadsArchivedQuery,
  RESTGetAPIChannelUsersThreadsArchivedResult,
  RESTPatchAPIChannelJSONBody,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPostAPIChannelFollowersJSONBody,
  RESTPostAPIChannelFollowersResult,
  RESTPostAPIChannelInviteJSONBody,
  RESTPostAPIChannelInviteResult,
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessagesBulkDeleteJSONBody,
  RESTPostAPIChannelThreadsJSONBody,
  RESTPostAPIGuildChannelJSONBody,
  RESTPostAPIGuildForumThreadsJSONBody,
  RESTPutAPIChannelPermissionJSONBody,
  RESTPutAPIChannelRecipientJSONBody,
  RESTPutAPIChannelRecipientResult,
  RESTPutAPIChannelThreadMembersResult,
  RESTPutAPIChannelVoiceStatusJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import type {
  ComponentInteraction,
  InteractionCollectorOptions,
} from "../collectors/InteractionCollector";
import InteractionCollector from "../collectors/InteractionCollector";
import type { MessageCollectorOptions } from "../collectors/MessageCollector";
import MessageCollector from "../collectors/MessageCollector";
import PermissionOverwriteManager, {
  type PermissionOverwriteChannel,
  type PermissionOverwriteManagerInterface,
} from "../managers/PermissionOverwriteManager";
import type { WebhookCreateOptions } from "../managers/WebhookManager";
import type { Collection } from "../utils/Collection";
import { ChannelType, Routes } from "../utils/constants";
import PermissionsBitField from "../utils/PermissionsBitField";
import type { MemberStructureInstance } from "./MemberStructure";
import type { MessageStructureInstance } from "./MessageStructure";
import MessageStructure from "./MessageStructure";
import type { RoleStructureInstance } from "./RoleStructure";
import type { WebhookStructureInstance } from "./WebhookStructure";

type AnyGuildChannel =
  | APITextChannel
  | APINewsChannel
  | APIGuildVoiceChannel
  | APIGuildCategoryChannel
  | APIThreadChannel;
type AnyChannel = APIChannel | AnyGuildChannel | APIDMChannel | APIGroupDMChannel;

/**
 * Message manager exposed as `channel.messages`.
 */
export interface AwaitMessagesOptions extends Omit<MessageCollectorOptions, "channelId"> {
  /** Collector end reasons that should reject the promise. */
  errors?: string[];
}

/**
 * Options for awaiting one message-component interaction.
 */
export interface AwaitMessageComponentOptions
  extends Omit<InteractionCollectorOptions, "channelId"> {
  /** Collector end reasons that should reject the promise. */
  errors?: string[];
}

export interface ChannelMessagesManager {
  /** Fetches the most recent messages. */
  fetch(): Promise<MessageStructureInstance[]>;
  /** Fetches messages using the official Discord query fields. */
  fetch(options: RESTGetAPIChannelMessagesQuery): Promise<MessageStructureInstance[]>;
  /** Fetches one message by ID. */
  fetch(messageId: string): Promise<MessageStructureInstance | null>;
  /** Sends a message to the channel. */
  send(
    content: string | RESTPostAPIChannelMessageJSONBody | FormData,
  ): Promise<MessageStructureInstance | null>;
  /** Edits one message in the channel. */
  edit(
    messageId: string,
    content: string | RESTPatchAPIChannelMessageJSONBody | FormData,
  ): Promise<MessageStructureInstance | null>;
  /** Deletes one message in the channel. */
  delete(messageId: string): Promise<void>;
  /** Deletes multiple messages in the channel. */
  bulkDelete(messageIds: RESTPostAPIChannelMessagesBulkDeleteJSONBody["messages"]): Promise<void>;
  /** Fetches pinned messages. */
  fetchPins(
    options?: RESTGetAPIChannelMessagesPinsQuery,
  ): Promise<RESTGetAPIChannelMessagesPinsResult | null>;
}

class ChannelStructure<T extends AnyChannel = AnyChannel> {
  public readonly client: Client;
  private readonly _permissionOverwrites: PermissionOverwriteManagerInterface;

  constructor(data: T, client: Client) {
    this.client = client;
    this._permissionOverwrites = new PermissionOverwriteManager(
      this as unknown as PermissionOverwriteChannel,
    );
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }

    const overwrites = (data as T & { permission_overwrites?: APIOverwrite[] })
      .permission_overwrites;
    for (const overwrite of overwrites ?? []) {
      this._permissionOverwrites._add(overwrite);
    }
  }

  /**
   * Manages this channel's permission overwrites.
   *
   * @returns The channel permission-overwrite manager.
   */
  public get permissionOverwrites(): PermissionOverwriteManagerInterface {
    return this._permissionOverwrites;
  }

  /**
   * The channel's mention
   */
  public get mention(): string {
    const channel = this as unknown as APIChannel;
    return `<#${channel.id}>`;
  }

  /**
   * The timestamp the channel was created at
   */
  public get createdTimestamp(): number {
    const channel = this as unknown as APIChannel;
    return Number((BigInt(channel.id) >> 22n) + 1420070400000n);
  }

  /**
   * The date the channel was created at
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * The ID of the last message sent in this channel, when Discord provided one.
   */
  public get lastMessageId(): string | null {
    const channel = this as unknown as APIChannel & { last_message_id?: string | null };
    return channel.last_message_id ?? null;
  }

  /**
   * The most recently cached message sent in this channel.
   *
   * This is a cache lookup; use
   * {@link ChannelStructure.fetchLastMessage} when a network request is required.
   */
  public get lastMessage(): MessageStructureInstance | null {
    const messageId = this.lastMessageId;
    return messageId ? (this.client.messages.get(messageId) ?? null) : null;
  }

  /**
   * The ISO-8601 timestamp of the last pinned message, when available.
   */
  public get lastPinTimestamp(): string | null {
    const channel = this as unknown as APIChannel & { last_pin_timestamp?: string | null };
    return channel.last_pin_timestamp ?? null;
  }

  /**
   * The date the last message was pinned, when available.
   */
  public get lastPinAt(): Date | null {
    return this.lastPinTimestamp ? new Date(this.lastPinTimestamp) : null;
  }

  /**
   * Fetches the channel's last-message reference from Discord.
   * @returns The last message, or null when no message ID is available or Discord returned no data.
   */
  public fetchLastMessage(): Promise<MessageStructureInstance | null> {
    return this.lastMessageId ? this.fetchMessage(this.lastMessageId) : Promise.resolve(null);
  }

  /**
   * Checks if this channel equals another channel
   * @param channel - The channel to compare with
   * @returns Whether the channels are equal
   */
  public equals(channel: ChannelStructureInstance): boolean {
    const channelA = this as unknown as APIChannel;
    const channelB = channel as unknown as APIChannel;
    return channelA.id === channelB.id;
  }

  /**
   * Whether Discord obfuscated this channel because it is not visible.
   */
  public get isObfuscated(): boolean {
    const channel = this as unknown as APIChannel & { flags?: number };
    return !!((channel.flags ?? 0) & (1 << 17));
  }

  /**
   * Whether the channel is text-based
   */
  public isTextBased(): this is ChannelStructureInstance<
    APITextChannel | APIDMChannel | APIGroupDMChannel | APINewsChannel | APIThreadChannel
  > {
    const channel = this as unknown as APIChannel;
    return [
      ChannelType.GuildText,
      ChannelType.DM,
      ChannelType.GroupDM,
      ChannelType.GuildAnnouncement,
      ChannelType.AnnouncementThread,
      ChannelType.PublicThread,
      ChannelType.PrivateThread,
    ].includes(channel.type);
  }

  /**
   * Whether the channel is a voice channel
   */
  public isVoiceBased(): this is ChannelStructureInstance<APIGuildVoiceChannel> {
    const channel = this as unknown as APIChannel;
    return [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(channel.type);
  }

  /**
   * Whether the channel is a thread
   */
  public isThread(): this is ChannelStructureInstance<APIThreadChannel> {
    const channel = this as unknown as APIChannel;
    return [
      ChannelType.AnnouncementThread,
      ChannelType.PublicThread,
      ChannelType.PrivateThread,
    ].includes(channel.type);
  }

  /**
   * Whether the channel is a DM channel
   */
  public isDM(): this is ChannelStructureInstance<APIDMChannel | APIGroupDMChannel> {
    const channel = this as unknown as APIChannel;
    return [ChannelType.DM, ChannelType.GroupDM].includes(channel.type);
  }

  /**
   * Whether the channel is a category
   */
  public isCategory(): this is ChannelStructureInstance<APIGuildCategoryChannel> {
    const channel = this as unknown as APIChannel;
    return channel.type === ChannelType.GuildCategory;
  }

  /**
   * Whether the channel is a guild text or announcement channel
   */
  public isGuildText(): this is ChannelStructureInstance<APITextChannel | APINewsChannel> {
    const channel = this as unknown as APIChannel;
    return [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type);
  }

  /**
   * Whether the channel is in a guild
   */
  public isGuild(): this is ChannelStructureInstance<AnyGuildChannel> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    return channel.guild_id !== undefined;
  }

  /**
   * Whether the channel is NSFW
   */
  public isNSFW(): this is ChannelStructureInstance<
    APITextChannel | APINewsChannel | APIThreadChannel | APIGuildVoiceChannel
  > {
    const channel = this as unknown as APIChannel & { nsfw?: boolean };
    return channel.nsfw ?? false;
  }

  /**
   * Resolves the effective permissions for a member or role in this channel.
   *
   * This applies the guild role permissions and the channel's official
   * permission overwrites in Discord's documented order.
   *
   * @param target - A cached member, role, or their ID.
   * @param checkAdministrator - Whether Administrator grants every permission.
   * @returns The effective permission bitfield, or null when the guild/member/role is unavailable.
   * @see https://docs.discord.com/developers/topics/permissions#permission-overwrites
   */
  public permissionsFor(
    target: string | MemberStructureInstance | RoleStructureInstance,
    checkAdministrator = true,
  ): PermissionsBitField | null {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    const guildId = channel.guild_id;
    if (!guildId) {
      return null;
    }

    const member =
      typeof target === "string"
        ? this.client.members.getMember(guildId, target)
        : "user" in target
          ? target
          : undefined;
    const role =
      typeof target === "string"
        ? this.client.roles.get(target)
        : "permissions" in target && "guild_id" in target
          ? target
          : undefined;
    const guild = this.client.guilds.cache.get(guildId);

    if (member) {
      if (guild && (guild as unknown as { owner_id?: string }).owner_id === member.user.id) {
        return new PermissionsBitField(PermissionsBitField.All);
      }

      const permissions = new PermissionsBitField();
      for (const memberRole of member.roles.cache.values()) {
        permissions.add(BigInt(memberRole.permissions));
      }
      this.applyOverwrite(permissions, this.permissionOverwrites.get(guildId));
      for (const memberRole of member.roles.cache.values()) {
        this.applyOverwrite(permissions, this.permissionOverwrites.get(memberRole.id));
      }
      this.applyOverwrite(permissions, this.permissionOverwrites.get(member.user.id));
      return checkAdministrator && permissions.hasAdministrator()
        ? new PermissionsBitField(PermissionsBitField.All)
        : permissions;
    }

    if (!role) {
      return null;
    }

    const permissions = new PermissionsBitField(BigInt(role.permissions));
    const everyoneRole = this.client.roles.get(guildId);
    if (everyoneRole && everyoneRole.id !== role.id) {
      permissions.add(BigInt(everyoneRole.permissions));
    }
    this.applyOverwrite(permissions, this.permissionOverwrites.get(guildId));
    this.applyOverwrite(permissions, this.permissionOverwrites.get(role.id));
    return checkAdministrator && permissions.hasAdministrator()
      ? new PermissionsBitField(PermissionsBitField.All)
      : permissions;
  }

  /**
   * Applies one cached overwrite to a permission bitfield.
   */
  private applyOverwrite(
    permissions: PermissionsBitField,
    overwrite: ReturnType<PermissionOverwriteManagerInterface["get"]>,
  ): void {
    if (!overwrite) {
      return;
    }
    permissions.remove(overwrite.deny).add(overwrite.allow);
  }

  /**
   * Sends a message to the channel
   * @param content - The content to send
   * @returns A promise that resolves to the sent message or null
   */
  public async send(
    content: string | RESTPostAPIChannelMessageJSONBody | FormData,
  ): Promise<MessageStructureInstance | null> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    const body = typeof content === "string" ? { content } : content;

    const message = (await this.client.rest.post(Routes.channelMessages(channel.id), {
      body,
    })) as APIMessage | null;

    if (!message) {
      return null;
    }

    return new MessageStructure(message, channel.id, channel.guild_id ?? null, this.client);
  }

  /**
   * Provides a message manager for this channel.
   * @returns The channel message manager.
   */
  public get messages(): ChannelMessagesManager {
    const fetch = ((value?: string | RESTGetAPIChannelMessagesQuery) =>
      typeof value === "string"
        ? this.fetchMessage(value)
        : this.fetchMessages(value)) as ChannelMessagesManager["fetch"];
    return {
      fetch,
      send: (content) => this.send(content),
      edit: (messageId, content) =>
        this.fetchMessage(messageId).then((message) => (message ? message.edit(content) : null)),
      delete: (messageId) => this.deleteMessage(messageId),
      bulkDelete: (messageIds) => this.bulkDelete(messageIds),
      fetchPins: (options) => this.fetchPins(options),
    };
  }

  /**
   * Fetches messages from the channel.
   * @param options - The official Discord channel-message query fields.
   * @returns A promise that resolves to an array of messages.
   */
  public async fetchMessages(
    options?: RESTGetAPIChannelMessagesQuery,
  ): Promise<MessageStructureInstance[]> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    const query = options
      ? Object.fromEntries(
          Object.entries(options)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined;
    const messages = (await this.client.rest.get(Routes.channelMessages(channel.id), {
      query,
    })) as APIMessage[] | null;

    if (!messages) {
      return [];
    }

    return messages.map(
      (m) => new MessageStructure(m, channel.id, channel.guild_id ?? null, this.client),
    );
  }

  /**
   * Fetches a single message from the channel
   * @param messageId - The message id to fetch
   * @returns A promise that resolves to the message or null
   */
  public async fetchMessage(messageId: string): Promise<MessageStructureInstance | null> {
    const channel = this as unknown as APIChannel & { guild_id?: string };

    const message = (await this.client.rest.get(
      Routes.channelMessage(channel.id, messageId),
    )) as APIMessage | null;

    if (!message) {
      return null;
    }

    return new MessageStructure(message, channel.id, channel.guild_id ?? null, this.client);
  }

  /**
   * Deletes a message from the channel
   * @param messageId - The message id to delete
   * @returns A promise that resolves when the message is deleted
   */
  public async deleteMessage(messageId: string): Promise<void> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    await this.client.rest.delete(Routes.channelMessage(channel.id, messageId));
  }

  /**
   * Bulk deletes messages from the channel
   * @param messageIds - The message ids to delete
   * @returns A promise that resolves when the messages are deleted
   */
  public async bulkDelete(
    messageIds: RESTPostAPIChannelMessagesBulkDeleteJSONBody["messages"],
  ): Promise<void> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    const body: RESTPostAPIChannelMessagesBulkDeleteJSONBody = { messages: messageIds };
    await this.client.rest.post(Routes.channelBulkDelete(channel.id), { body });
  }

  /**
   * Starts typing in the channel
   * @returns A promise that resolves when the typing indicator is sent
   */
  public async sendTyping(): Promise<void> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    await this.client.rest.post(Routes.channelTyping(channel.id));
  }

  /**
   * Fetches the invites created for this channel.
   *
   * @returns The official Discord extended invite objects.
   * @see https://docs.discord.com/developers/resources/channel#get-channel-invites
   */
  public async fetchInvites(): Promise<RESTGetAPIChannelInvitesResult> {
    const channel = this as unknown as APIChannel;
    return (await this.client.rest.get(
      Routes.channelInvites(channel.id),
    )) as RESTGetAPIChannelInvitesResult;
  }

  /**
   * Creates an invite for this channel.
   *
   * @param data - The official Discord channel-invite body.
   * @param reason - Optional audit-log reason.
   * @returns The created invite.
   * @see https://docs.discord.com/developers/resources/channel#create-channel-invite
   */
  public async createInvite(
    data: RESTPostAPIChannelInviteJSONBody = {},
    reason?: string,
  ): Promise<RESTPostAPIChannelInviteResult | null> {
    const channel = this as unknown as APIChannel;
    return (await this.client.rest.post(Routes.channelInvites(channel.id), {
      body: data,
      reason,
    })) as RESTPostAPIChannelInviteResult | null;
  }

  /**
   * Edits a permission overwrite for this channel.
   *
   * @param overwriteId - The role or user ID represented by the overwrite.
   * @param data - The official Discord permission-overwrite body.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/channel#edit-channel-permissions
   */
  public async editPermissionOverwrite(
    overwriteId: string,
    data: RESTPutAPIChannelPermissionJSONBody,
    reason?: string,
  ): Promise<void> {
    const channel = this as unknown as APIChannel;
    await this.client.rest.put(Routes.channelPermission(channel.id, overwriteId), {
      body: data,
      reason,
    });
  }

  /**
   * Deletes a permission overwrite from this channel.
   *
   * @param overwriteId - The role or user ID represented by the overwrite.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/channel#delete-channel-permission
   */
  public async deletePermissionOverwrite(overwriteId: string, reason?: string): Promise<void> {
    const channel = this as unknown as APIChannel;
    await this.client.rest.delete(Routes.channelPermission(channel.id, overwriteId), { reason });
  }

  /**
   * Fetches pinned messages and their pagination metadata.
   *
   * @param options - The official Discord pinned-message query fields.
   * @returns The pinned-message response.
   * @see https://docs.discord.com/developers/resources/message#get-channel-pins
   */
  public async fetchPins(
    options?: RESTGetAPIChannelMessagesPinsQuery,
  ): Promise<RESTGetAPIChannelMessagesPinsResult | null> {
    const channel = this as unknown as APIChannel;
    const query = options
      ? Object.fromEntries(Object.entries(options).map(([key, value]) => [key, String(value)]))
      : undefined;
    return (await this.client.rest.get(Routes.channelMessagesPins(channel.id), {
      query,
    })) as RESTGetAPIChannelMessagesPinsResult | null;
  }

  /**
   * Follows a news channel into a target channel.
   *
   * @param data - The official Discord follower body.
   * @returns The created followed-channel record.
   * @see https://docs.discord.com/developers/resources/channel#follow-news-channel
   */
  public async follow(
    data: RESTPostAPIChannelFollowersJSONBody,
  ): Promise<RESTPostAPIChannelFollowersResult | null> {
    const channel = this as unknown as APIChannel;
    return (await this.client.rest.post(Routes.channelFollowers(channel.id), {
      body: data,
    })) as RESTPostAPIChannelFollowersResult | null;
  }

  /**
   * Fetches all webhooks for this channel.
   * @returns The channel's webhook structures.
   */
  public fetchWebhooks(): Promise<WebhookStructureInstance[]> {
    const channel = this as unknown as APIChannel;
    return this.client.webhooks.fetchChannel(channel.id);
  }

  /**
   * Creates a webhook for this channel.
   * @param options - The official Discord webhook body and optional audit-log reason.
   * @returns The created webhook, or null when Discord returned no data.
   */
  public createWebhook(options: WebhookCreateOptions): Promise<WebhookStructureInstance | null> {
    const channel = this as unknown as APIChannel;
    return this.client.webhooks.create(channel.id, options);
  }

  /**
   * Creates a message collector on this channel
   * @param options - Collector options
   * @returns A new message collector
   */
  public createMessageCollector(
    options?: Omit<MessageCollectorOptions, "channelId">,
  ): MessageCollector {
    const channel = this as unknown as APIChannel & { id: string };
    return new MessageCollector(this.client, {
      ...options,
      channelId: channel.id,
    });
  }

  /**
   * Creates a message-component collector on this channel.
   * @param options - Interaction collector options.
   * @returns A new interaction collector.
   */
  public createMessageComponentCollector(
    options?: Omit<InteractionCollectorOptions, "channelId">,
  ): InteractionCollector {
    const channel = this as unknown as APIChannel & { id: string };
    return new InteractionCollector(this.client, {
      ...options,
      channelId: channel.id,
    });
  }

  /**
   * Waits for messages that satisfy the supplied collector options.
   * @param options - Message collector options and optional rejection reasons.
   * @returns The collected official Discord message payloads.
   */
  public awaitMessages(
    options: AwaitMessagesOptions = {},
  ): Promise<Collection<string, APIMessage>> {
    const { errors, ...collectorOptions } = options;
    return new Promise((resolve, reject) => {
      const collector = this.createMessageCollector(collectorOptions);
      collector.once("end", (collected, reason) => {
        if (errors?.includes(reason)) {
          reject(collected);
        } else {
          resolve(collected);
        }
      });
    });
  }

  /**
   * Waits for one message-component interaction.
   * @param options - Interaction collector options and optional rejection reasons.
   * @returns The first matching official Discord component interaction.
   */
  public awaitMessageComponent(
    options: AwaitMessageComponentOptions = {},
  ): Promise<ComponentInteraction> {
    const { errors: _errors, ...collectorOptions } = options;
    return new Promise((resolve, reject) => {
      const collector = this.createMessageComponentCollector({
        ...collectorOptions,
        max: 1,
      });
      collector.once("end", (collected, reason) => {
        const interaction = collected.first();
        if (interaction) {
          resolve(interaction);
        } else {
          reject(new Error(`Message component collector ended: ${reason}`));
        }
      });
    });
  }

  /**
   * Starts a thread without a starter message.
   *
   * @param data - The official Discord thread-creation body.
   * @returns The created thread, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/channel#start-thread-without-message
   */
  public async startThread(
    data: RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody,
  ): Promise<ChannelStructureInstance | null> {
    const channel = this as unknown as APIChannel;
    const thread = (await this.client.rest.post(Routes.threads(channel.id), {
      body: data,
    })) as APIChannel | null;
    if (!thread) {
      return null;
    }
    return new ChannelStructure(thread, this.client) as unknown as ChannelStructureInstance;
  }

  /**
   * Joins this thread as the current user.
   *
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/channel#join-thread
   */
  public async join(): Promise<void> {
    const channel = this as unknown as APIChannel;
    await this.client.rest.put(Routes.threadMembers(channel.id, "@me"));
  }

  /**
   * Leaves this thread as the current user.
   *
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/channel#leave-thread
   */
  public async leave(): Promise<void> {
    const channel = this as unknown as APIChannel;
    await this.client.rest.delete(Routes.threadMembers(channel.id, "@me"));
  }

  /**
   * Fetches the members of this thread.
   *
   * @param options - The official Discord thread-member query fields.
   * @returns The thread members.
   * @see https://docs.discord.com/developers/resources/channel#list-thread-members
   */
  public async fetchThreadMember(
    userId: string,
    options?: RESTGetAPIChannelThreadMemberQuery,
  ): Promise<RESTGetAPIChannelThreadMemberResult> {
    const channel = this as unknown as APIChannel;
    const query = options
      ? Object.fromEntries(
          Object.entries(options)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined;
    return (await this.client.rest.get(Routes.threadMembers(channel.id, userId), {
      query,
    })) as RESTGetAPIChannelThreadMemberResult;
  }

  /**
   * Fetches all members of this thread.
   *
   * @param options - The official Discord thread-member query fields.
   * @returns The thread members.
   * @see https://docs.discord.com/developers/resources/channel#list-thread-members
   */
  public async fetchThreadMembers(
    options?: RESTGetAPIChannelThreadMembersQuery,
  ): Promise<RESTGetAPIChannelThreadMembersResult> {
    const channel = this as unknown as APIChannel;
    const query = options
      ? Object.fromEntries(Object.entries(options).map(([key, value]) => [key, String(value)]))
      : undefined;
    return (await this.client.rest.get(Routes.threadMembers(channel.id), {
      query,
    })) as RESTGetAPIChannelThreadMembersResult;
  }

  /**
   * Adds a user to this thread.
   *
   * @param userId - The user ID to add.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/channel#add-thread-member
   */
  public async addThreadMember(userId: string): Promise<RESTPutAPIChannelThreadMembersResult> {
    const channel = this as unknown as APIChannel;
    return (await this.client.rest.put(
      Routes.threadMembers(channel.id, userId),
    )) as RESTPutAPIChannelThreadMembersResult;
  }

  /**
   * Removes a user from this thread.
   *
   * @param userId - The user ID to remove.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/channel#remove-thread-member
   */
  public async removeThreadMember(
    userId: string,
  ): Promise<RESTDeleteAPIChannelThreadMembersResult> {
    const channel = this as unknown as APIChannel;
    return (await this.client.rest.delete(
      Routes.threadMembers(channel.id, userId),
    )) as RESTDeleteAPIChannelThreadMembersResult;
  }

  /**
   * Fetches archived threads from this channel.
   *
   * @param status - Whether to fetch public or private archived threads.
   * @param options - The official archived-thread query fields.
   * @returns The archived-thread list returned by Discord.
   * @see https://docs.discord.com/developers/resources/channel#list-public-archived-threads
   */
  public async fetchArchivedThreads(
    status: "public" | "private",
    options?: RESTGetAPIChannelThreadsArchivedQuery,
  ): Promise<
    RESTGetAPIChannelThreadsArchivedPublicResult | RESTGetAPIChannelThreadsArchivedPrivateResult
  > {
    const channel = this as unknown as APIChannel;
    const query = options
      ? Object.fromEntries(
          Object.entries(options)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined;
    return (await this.client.rest.get(Routes.channelThreads(channel.id, status), {
      query,
    })) as
      | RESTGetAPIChannelThreadsArchivedPublicResult
      | RESTGetAPIChannelThreadsArchivedPrivateResult;
  }

  /**
   * Fetches private archived threads joined by the current user.
   *
   * @param options - The official archived-thread query fields.
   * @returns The archived-thread list returned by Discord.
   * @see https://docs.discord.com/developers/resources/channel#list-joined-private-archived-threads
   */
  public async fetchJoinedArchivedThreads(
    options?: RESTGetAPIChannelThreadsArchivedQuery,
  ): Promise<RESTGetAPIChannelUsersThreadsArchivedResult> {
    const channel = this as unknown as APIChannel;
    const query = options
      ? Object.fromEntries(
          Object.entries(options)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined;
    return (await this.client.rest.get(Routes.channelJoinedArchivedThreads(channel.id), {
      query,
    })) as RESTGetAPIChannelUsersThreadsArchivedResult;
  }

  /**
   * Sets the displayed status of a voice channel.
   *
   * @param status - The new status, or null to clear it.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/channel#set-voice-channel-status
   */
  public async setVoiceStatus(status: string | null): Promise<void> {
    const channel = this as unknown as APIChannel;
    const data: RESTPutAPIChannelVoiceStatusJSONBody = { status };
    await this.client.rest.put(Routes.channelVoiceStatus(channel.id), { body: data });
  }

  /**
   * Adds a recipient to a group DM channel.
   *
   * @param userId - The user ID to add.
   * @param data - The official group-DM recipient body.
   * @returns The API result returned by Discord.
   * @see https://docs.discord.com/developers/resources/channel#group-dm-add-recipient
   */
  public async addRecipient(
    userId: string,
    data: RESTPutAPIChannelRecipientJSONBody,
  ): Promise<RESTPutAPIChannelRecipientResult> {
    const channel = this as unknown as APIChannel;
    return (await this.client.rest.put(Routes.channelRecipient(channel.id, userId), {
      body: data,
    })) as RESTPutAPIChannelRecipientResult;
  }

  /**
   * Removes a recipient from a group DM channel.
   *
   * @param userId - The user ID to remove.
   * @returns The API result returned by Discord.
   * @see https://docs.discord.com/developers/resources/channel#group-dm-remove-recipient
   */
  public async removeRecipient(userId: string): Promise<RESTDeleteAPIChannelRecipientResult> {
    const channel = this as unknown as APIChannel;
    return (await this.client.rest.delete(
      Routes.channelRecipient(channel.id, userId),
    )) as RESTDeleteAPIChannelRecipientResult;
  }

  /**
   * Changes this thread's name.
   *
   * @param name - The new thread name.
   * @param reason - Optional audit-log reason.
   * @returns The edited thread, or null when Discord returned no data.
   */
  public setName(name: string, reason?: string): Promise<ChannelStructureInstance | null> {
    return this.edit({ name }, reason);
  }

  /**
   * Sets this thread's automatic archive duration.
   *
   * @param duration - The official Discord thread auto-archive duration.
   * @param reason - Optional audit-log reason.
   * @returns The edited thread, or null when Discord returned no data.
   */
  public setAutoArchiveDuration(
    duration: RESTPatchAPIChannelJSONBody["auto_archive_duration"],
    reason?: string,
  ): Promise<ChannelStructureInstance | null> {
    return this.edit({ auto_archive_duration: duration }, reason);
  }

  /**
   * Sets this thread's slowmode rate limit.
   *
   * @param seconds - The number of seconds between messages.
   * @param reason - Optional audit-log reason.
   * @returns The edited thread, or null when Discord returned no data.
   */
  public setRateLimitPerUser(
    seconds: number,
    reason?: string,
  ): Promise<ChannelStructureInstance | null> {
    return this.edit({ rate_limit_per_user: seconds }, reason);
  }

  /**
   * Sets whether non-moderators can invite other non-moderators to a private thread.
   *
   * @param invitable - Whether the thread is invitable.
   * @param reason - Optional audit-log reason.
   * @returns The edited thread, or null when Discord returned no data.
   */
  public setInvitable(
    invitable: boolean,
    reason?: string,
  ): Promise<ChannelStructureInstance | null> {
    return this.edit({ invitable }, reason);
  }

  /**
   * Sets the applied forum tags for this thread.
   *
   * @param appliedTags - The forum tag IDs to apply.
   * @param reason - Optional audit-log reason.
   * @returns The edited thread, or null when Discord returned no data.
   */
  public setAppliedTags(
    appliedTags: string[],
    reason?: string,
  ): Promise<ChannelStructureInstance | null> {
    return this.edit({ applied_tags: appliedTags }, reason);
  }

  /**
   * Archives or unarchives this thread.
   *
   * @param archived - Whether the thread should be archived.
   * @param reason - Optional audit-log reason.
   * @returns The edited thread, or null when Discord returned no data.
   */
  public setArchived(archived: boolean, reason?: string): Promise<ChannelStructureInstance | null> {
    return this.edit({ archived }, reason);
  }

  /**
   * Locks or unlocks this thread.
   *
   * @param locked - Whether the thread should be locked.
   * @param reason - Optional audit-log reason.
   * @returns The edited thread, or null when Discord returned no data.
   */
  public setLocked(locked: boolean, reason?: string): Promise<ChannelStructureInstance | null> {
    return this.edit({ locked }, reason);
  }

  /**
   * Pins this thread in its parent forum channel.
   *
   * @param reason - Optional audit-log reason.
   * @returns The edited thread, or null when Discord returned no data.
   */
  public pin(reason?: string): Promise<ChannelStructureInstance | null> {
    const channel = this as unknown as APIChannel & { flags?: number };
    return this.edit(
      { flags: ((channel.flags ?? 0) | 2) as RESTPatchAPIChannelJSONBody["flags"] },
      reason,
    );
  }

  /**
   * Unpins this thread from its parent forum channel.
   *
   * @param reason - Optional audit-log reason.
   * @returns The edited thread, or null when Discord returned no data.
   */
  public unpin(reason?: string): Promise<ChannelStructureInstance | null> {
    const channel = this as unknown as APIChannel & { flags?: number };
    return this.edit(
      { flags: ((channel.flags ?? 0) & ~2) as RESTPatchAPIChannelJSONBody["flags"] },
      reason,
    );
  }

  /**
   * Fetches the channel (refetches from API)
   * @returns A promise that resolves to the fetched channel
   */
  public async fetch(): Promise<ChannelStructureInstance | null> {
    const channel = this as unknown as APIChannel & { id: string };
    const fetchedChannel = (await this.client.rest.get(
      Routes.channel(channel.id),
    )) as APIChannel | null;

    if (!fetchedChannel) {
      return null;
    }

    return new ChannelStructure(fetchedChannel, this.client) as unknown as ChannelStructureInstance;
  }

  /**
   * Edits the channel.
   *
   * @param data - The official Discord channel-edit body.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves to the edited channel.
   */
  public async edit(
    data: RESTPatchAPIChannelJSONBody,
    reason?: string,
  ): Promise<ChannelStructureInstance | null> {
    const channel = this as unknown as APIChannel & { id: string };
    const editedChannel = (await this.client.rest.patch(Routes.channel(channel.id), {
      body: data,
      reason,
    })) as APIChannel | null;

    if (!editedChannel) {
      return null;
    }

    return new ChannelStructure(editedChannel, this.client) as unknown as ChannelStructureInstance;
  }

  /**
   * Deletes the channel
   * @returns A promise that resolves when the channel is deleted
   */
  public async delete(): Promise<void> {
    const channel = this as unknown as APIChannel & { id: string };
    await this.client.rest.delete(Routes.channel(channel.id));
  }

  /**
   * Clones the channel
   * @param name - Optional new name for the cloned channel
   * @returns A promise that resolves to the cloned channel
   */
  public async clone(name?: string): Promise<ChannelStructureInstance | null> {
    const channel = this as unknown as AnyGuildChannel;
    if (!channel.guild_id) {
      return null;
    }

    const body: RESTPostAPIGuildChannelJSONBody = {
      name: name ?? `${channel.name}-clone`,
      type: channel.type,
    };
    const clonedChannel = (await this.client.rest.post(Routes.guildChannels(channel.guild_id), {
      body,
    })) as APIChannel | null;

    if (!clonedChannel) {
      return null;
    }

    return new ChannelStructure(clonedChannel, this.client) as unknown as ChannelStructureInstance;
  }
}

export default ChannelStructure as new <T extends APIChannel = APIChannel>(
  data: T,
  client: Client,
) => ChannelStructure<T> & T & { readonly client: Client };

export type ChannelStructureInstance<T extends APIChannel = APIChannel> = ChannelStructure<T> &
  T & { readonly client: Client };
