import type { APIMessage } from "discord-api-types/v10";
import type Client from "../client";
import type { CollectorOptions } from "./Collector";
import Collector from "./Collector";

export interface MessageCollectorOptions extends CollectorOptions<APIMessage> {
  /** Channel ID to filter messages */
  channelId?: string;
  /** Guild ID to filter messages */
  guildId?: string;
  /** User ID to filter messages */
  userId?: string;
  /** Whether to only collect messages from the specified user */
  onlyFromUser?: boolean;
}

class MessageCollector extends Collector<string, APIMessage, [APIMessage]> {
  private readonly options: MessageCollectorOptions;

  constructor(client: Client, options: MessageCollectorOptions = {}) {
    super(client, options);
    this.options = options;
  }

  /**
   * Handles incoming messages
   * @param message - The message to handle
   * @returns Whether the message was collected
   */
  public async handle(message: APIMessage): Promise<boolean> {
    // Filter by channel ID
    if (this.options.channelId && message.channel_id !== this.options.channelId) {
      return false;
    }

    // Filter by guild ID
    if (
      this.options.guildId &&
      (message as APIMessage & { guild_id?: string }).guild_id !== this.options.guildId
    ) {
      return false;
    }

    // Filter by user ID
    if (this.options.userId && message.author?.id !== this.options.userId) {
      return false;
    }

    return super.handle(message, message);
  }

  /**
   * Gets the key for a message
   * @param message - The message to get the key for
   * @returns The message ID
   */
  protected getKey(message: APIMessage): string {
    return message.id;
  }

  /**
   * Emits an event
   * @param event - The event to emit
   * @param args - Event arguments
   */
  protected emit(_event: string, ..._args: unknown[]): void {
    // Subclasses should implement this
  }

  /**
   * Checks if the collector should end
   */
  protected checkEnd(): void {
    // Default implementation does nothing
  }

  /**
   * Creates a new message collector for a channel
   * @param client - The client instance
   * @param channelId - The channel ID to collect messages from
   * @param options - Collector options
   * @returns A new message collector
   */
  public static createChannelCollector(
    client: Client,
    channelId: string,
    options?: Omit<MessageCollectorOptions, "channelId">,
  ): MessageCollector {
    return new MessageCollector(client, { ...options, channelId });
  }

  /**
   * Creates a new message collector for a user
   * @param client - The client instance
   * @param userId - The user ID to collect messages from
   * @param options - Collector options
   * @returns A new message collector
   */
  public static createUserCollector(
    client: Client,
    userId: string,
    options?: Omit<MessageCollectorOptions, "userId">,
  ): MessageCollector {
    return new MessageCollector(client, { ...options, userId, onlyFromUser: true });
  }
}

export default MessageCollector;
