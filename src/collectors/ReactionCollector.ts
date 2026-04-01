import type Client from "../client";
import type { CollectorOptions } from "./Collector";
import Collector from "./Collector";

export interface MessageReaction {
  emoji: {
    id: string | null;
    name: string | null;
    animated?: boolean;
  };
  count: number;
  me: boolean;
  message_id: string;
  channel_id: string;
  guild_id?: string;
  user_id?: string;
}

export interface ReactionCollectorOptions extends CollectorOptions<MessageReaction> {
  /** Message ID to filter reactions */
  messageId?: string;
  /** Channel ID to filter reactions */
  channelId?: string;
  /** Guild ID to filter reactions */
  guildId?: string;
  /** User ID to filter reactions */
  userId?: string;
  /** Emoji ID or name to filter reactions */
  emoji?: string;
  /** Maximum number of reactions to collect */
  maxReactions?: number;
}

class ReactionCollector extends Collector<string, MessageReaction, [string]> {
  private readonly options: ReactionCollectorOptions;
  private readonly _reactions: Map<string, number>;

  constructor(client: Client, options: ReactionCollectorOptions = {}) {
    super(client, options);
    this.options = options;
    this._reactions = new Map();
  }

  /**
   * Handles incoming reactions
   * @param reaction - The reaction to handle
   * @param userId - The user ID who added the reaction
   * @returns Whether the reaction was collected
   */
  public override async handle(reaction: MessageReaction, userId?: string): Promise<boolean> {
    // Filter by message ID
    if (this.options.messageId && reaction.message_id !== this.options.messageId) {
      return false;
    }

    // Filter by channel ID
    if (this.options.channelId && reaction.channel_id !== this.options.channelId) {
      return false;
    }

    // Filter by guild ID
    if (this.options.guildId && reaction.guild_id !== this.options.guildId) {
      return false;
    }

    // Filter by user ID
    if (this.options.userId && userId && userId !== this.options.userId) {
      return false;
    }

    // Filter by emoji
    if (this.options.emoji) {
      const emojiId = reaction.emoji.id ?? reaction.emoji.name;
      if (emojiId !== this.options.emoji) {
        return false;
      }
    }

    // Track reactions
    const emojiKey = reaction.emoji.id ?? reaction.emoji.name ?? "unknown";
    const count = this._reactions.get(emojiKey) ?? 0;
    this._reactions.set(emojiKey, count + 1);

    // Check max reactions
    if (this.options.maxReactions && count + 1 > this.options.maxReactions) {
      return false;
    }

    return super.handleWithArgs(reaction, userId ?? "unknown");
  }

  /**
   * Gets the key for a reaction
   * @param reaction - The reaction to get the key for
   * @returns The reaction key
   */
  protected getKey(reaction: MessageReaction): string {
    const userId = reaction.user_id ?? "unknown";
    return `${reaction.message_id}:${reaction.emoji.id ?? reaction.emoji.name}:${userId}`;
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
   * Gets the total number of unique reactions
   */
  public get uniqueReactions(): number {
    return this._reactions.size;
  }

  /**
   * Gets the total number of reactions
   */
  public get totalReactions(): number {
    let total = 0;
    for (const count of this._reactions.values()) {
      total += count;
    }
    return total;
  }

  /**
   * Creates a new reaction collector for a message
   * @param client - The client instance
   * @param messageId - The message ID to collect reactions from
   * @param options - Collector options
   * @returns A new reaction collector
   */
  public static createMessageCollector(
    client: Client,
    messageId: string,
    options?: Omit<ReactionCollectorOptions, "messageId">,
  ): ReactionCollector {
    return new ReactionCollector(client, { ...options, messageId });
  }

  /**
   * Creates a new reaction collector for an emoji
   * @param client - The client instance
   * @param emoji - The emoji ID or name to collect
   * @param options - Collector options
   * @returns A new reaction collector
   */
  public static createEmojiCollector(
    client: Client,
    emoji: string,
    options?: Omit<ReactionCollectorOptions, "emoji">,
  ): ReactionCollector {
    return new ReactionCollector(client, { ...options, emoji });
  }
}

export default ReactionCollector;
