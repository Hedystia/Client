import type {
  APIChannel,
  APIDMChannel,
  APIGroupDMChannel,
  APIGuildCategoryChannel,
  APIGuildChannel,
  APIGuildVoiceChannel,
  APIMessage,
  APINewsChannel,
  APITextChannel,
  APIThreadChannel,
} from "discord-api-types/v10";
import type Client from "../client";
import type { MessageCollectorOptions } from "../collectors/MessageCollector";
import MessageCollector from "../collectors/MessageCollector";
import type { MessageStructureInstance } from "./MessageStructure";
import MessageStructure from "./MessageStructure";

type AnyGuildChannel =
  | APIGuildChannel
  | APITextChannel
  | APINewsChannel
  | APIGuildVoiceChannel
  | APIGuildCategoryChannel
  | APIThreadChannel;
type AnyChannel = APIChannel | AnyGuildChannel | APIDMChannel | APIGroupDMChannel;

class ChannelStructure<T extends AnyChannel = AnyChannel> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
    this.client = client;
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
   * Whether the channel is text-based
   */
  public get isTextBased(): boolean {
    const channel = this as unknown as APIChannel;
    return [0, 1, 3, 5, 10, 11, 12].includes(channel.type);
  }

  /**
   * Whether the channel is a voice channel
   */
  public get isVoiceBased(): boolean {
    const channel = this as unknown as APIChannel;
    return [2, 13].includes(channel.type);
  }

  /**
   * Whether the channel is a thread
   */
  public get isThread(): boolean {
    const channel = this as unknown as APIChannel;
    return [10, 11, 12].includes(channel.type);
  }

  /**
   * Whether the channel is a DM channel
   */
  public get isDM(): boolean {
    const channel = this as unknown as APIChannel;
    return [1, 3].includes(channel.type);
  }

  /**
   * Whether the channel is in a guild
   */
  public get isGuild(): boolean {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    return channel.guild_id !== undefined;
  }

  /**
   * Whether the channel is NSFW
   */
  public get isNSFW(): boolean {
    const channel = this as unknown as APIChannel & { nsfw?: boolean };
    return channel.nsfw ?? false;
  }

  /**
   * Sends a message to the channel
   * @param content - The content to send
   * @returns A promise that resolves to the sent message
   */
  public async send(
    content:
      | string
      | {
          content?: string;
          embeds?: Array<{ title?: string; description?: string; color?: number }>;
        },
  ): Promise<MessageStructureInstance | null> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    const body = typeof content === "string" ? { content } : content;

    const message = (await this.client.rest.post(`/channels/${channel.id}/messages`, {
      body,
    })) as APIMessage | null;

    if (!message) {
      return null;
    }

    return new MessageStructure(message, channel.id, channel.guild_id ?? null, this.client);
  }

  /**
   * Fetches messages from the channel
   * @param options - Fetch options
   * @returns A promise that resolves to an array of messages
   */
  public async fetchMessages(options?: {
    limit?: number;
    before?: string;
    after?: string;
    around?: string;
  }): Promise<MessageStructureInstance[]> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    const query = new URLSearchParams();

    if (options?.limit) {
      query.set("limit", options.limit.toString());
    }
    if (options?.before) {
      query.set("before", options.before);
    }
    if (options?.after) {
      query.set("after", options.after);
    }
    if (options?.around) {
      query.set("around", options.around);
    }

    const messages = (await this.client.rest.get(
      `/channels/${channel.id}/messages?${query.toString()}`,
    )) as APIMessage[] | null;

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
      `/channels/${channel.id}/messages/${messageId}`,
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
    await this.client.rest.delete(`/channels/${channel.id}/messages/${messageId}`);
  }

  /**
   * Bulk deletes messages from the channel
   * @param messageIds - The message ids to delete
   * @returns A promise that resolves when the messages are deleted
   */
  public async bulkDelete(messageIds: string[]): Promise<void> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    await this.client.rest.post(`/channels/${channel.id}/messages/bulk-delete`, {
      body: { messages: messageIds },
    });
  }

  /**
   * Starts typing in the channel
   * @returns A promise that resolves when the typing indicator is sent
   */
  public async sendTyping(): Promise<void> {
    const channel = this as unknown as APIChannel & { guild_id?: string };
    await this.client.rest.post(`/channels/${channel.id}/typing`);
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
   * Fetches the channel (refetches from API)
   * @returns A promise that resolves to the fetched channel
   */
  public async fetch(): Promise<ChannelStructureInstance | null> {
    const channel = this as unknown as APIChannel & { id: string };
    const fetchedChannel = (await this.client.rest.get(
      `/channels/${channel.id}`,
    )) as APIChannel | null;

    if (!fetchedChannel) {
      return null;
    }

    return new ChannelStructure(fetchedChannel, this.client) as unknown as ChannelStructureInstance;
  }

  /**
   * Edits the channel
   * @param data - The new channel data
   * @returns A promise that resolves to the edited channel
   */
  public async edit(data: {
    name?: string;
    topic?: string;
    position?: number;
  }): Promise<ChannelStructureInstance | null> {
    const channel = this as unknown as APIChannel & { id: string };
    const editedChannel = (await this.client.rest.patch(`/channels/${channel.id}`, {
      body: data,
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
    await this.client.rest.delete(`/channels/${channel.id}`);
  }

  /**
   * Clones the channel
   * @param name - Optional new name for the cloned channel
   * @returns A promise that resolves to the cloned channel
   */
  public async clone(name?: string): Promise<ChannelStructureInstance | null> {
    const channel = this as unknown as APIGuildChannel & {
      id: string;
      guild_id: string;
      type: number;
      name: string;
    };
    if (!channel.guild_id) {
      return null;
    }

    const clonedChannel = (await this.client.rest.post(`/guilds/${channel.guild_id}/channels`, {
      body: {
        name: name ?? `${channel.name}-clone`,
        type: channel.type,
      },
    })) as APIGuildChannel | null;

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

export type ChannelStructureInstance = ChannelStructure & APIChannel & { readonly client: Client };
