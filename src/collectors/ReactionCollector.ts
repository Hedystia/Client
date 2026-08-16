import type { GatewayMessageReactionRemoveDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import type { MessageReactionStructureInstance } from "../structures/MessageReactionStructure";
import type { CollectorOptions } from "./Collector";
import Collector from "./Collector";

/**
 * Official Discord gateway data shared by reaction add and remove events.
 *
 * @see https://docs.discord.com/developers/topics/gateway-events#message-reaction-add
 * @see https://docs.discord.com/developers/topics/gateway-events#message-reaction-remove
 */
export type MessageReaction = GatewayMessageReactionRemoveDispatchData;

export interface ReactionCollectorOptions extends CollectorOptions<MessageReaction> {
  /** Message ID to filter reactions. */
  messageId?: string;
  /** Channel ID to filter reactions. */
  channelId?: string;
  /** Guild ID to filter reactions. */
  guildId?: string;
  /** User ID to filter reactions. */
  userId?: string;
  /** Emoji ID or name to filter reactions. */
  emoji?: string;
  /** Maximum number of reactions to collect. */
  maxReactions?: number;
}

class ReactionCollector extends Collector<string, MessageReaction, [string]> {
  private readonly options: ReactionCollectorOptions;
  private readonly _reactions: Map<string, number>;
  private readonly reactionAddListener = (reaction: MessageReactionStructureInstance): void => {
    this.handle(reaction, reaction.user_id).catch(() => undefined);
  };
  private readonly reactionRemoveListener = (reaction: MessageReactionStructureInstance): void => {
    this.disposeReaction(reaction, reaction.user_id);
  };

  constructor(client: Client, options: ReactionCollectorOptions = {}) {
    super(client, options);
    this.options = options;
    this._reactions = new Map();
    this.client.on("messageReactionAdd", this.reactionAddListener);
    this.client.on("messageReactionRemove", this.reactionRemoveListener);
  }

  /**
   * Stops this collector and removes its gateway reaction listeners.
   * @param reason - The reason for stopping the collector.
   */
  public override stop(reason = "user"): void {
    this.client.off("messageReactionAdd", this.reactionAddListener);
    this.client.off("messageReactionRemove", this.reactionRemoveListener);
    super.stop(reason);
  }

  /**
   * Handles an incoming reaction.
   * @param reaction - The official Discord reaction payload.
   * @param userId - The ID of the user who reacted.
   * @returns Whether the reaction was collected.
   */
  public override async handle(reaction: MessageReaction, userId?: string): Promise<boolean> {
    if (!this.matches(reaction, userId)) {
      return false;
    }

    const emojiKey = reaction.emoji.id ?? reaction.emoji.name ?? "unknown";
    const count = this._reactions.get(emojiKey) ?? 0;
    if (this.options.maxReactions && count + 1 > this.options.maxReactions) {
      return false;
    }
    this._reactions.set(emojiKey, count + 1);

    return super.handleWithArgs(reaction, userId ?? reaction.user_id);
  }

  /**
   * Removes a reaction from the collected set when disposal is enabled.
   * @param reaction - The official Discord reaction payload.
   * @param userId - The ID of the user whose reaction was removed.
   */
  private disposeReaction(reaction: MessageReaction, userId: string): void {
    if (!this.dispose || !this.matches(reaction, userId)) {
      return;
    }

    if (this.collected.delete(this.getKey(reaction, userId))) {
      this.emit("dispose", reaction, userId);
    }
  }

  /**
   * Checks whether a reaction matches this collector's filters.
   * @param reaction - The official Discord reaction payload.
   * @param userId - The ID of the user who reacted.
   * @returns Whether the reaction matches.
   */
  private matches(reaction: MessageReaction, userId?: string): boolean {
    if (this.options.messageId && reaction.message_id !== this.options.messageId) {
      return false;
    }
    if (this.options.channelId && reaction.channel_id !== this.options.channelId) {
      return false;
    }
    if (this.options.guildId && reaction.guild_id !== this.options.guildId) {
      return false;
    }
    if (this.options.userId && userId !== this.options.userId) {
      return false;
    }
    if (this.options.emoji) {
      const emojiId = reaction.emoji.id ?? reaction.emoji.name;
      if (emojiId !== this.options.emoji) {
        return false;
      }
    }
    return true;
  }

  /**
   * Gets the key for a reaction.
   * @param reaction - The official Discord reaction payload.
   * @param userId - The ID of the user who reacted.
   * @returns The unique reaction key.
   */
  protected getKey(reaction: MessageReaction, userId?: string): string {
    return `${reaction.message_id}:${reaction.emoji.id ?? reaction.emoji.name}:${userId ?? reaction.user_id}`;
  }

  /**
   * Gets the number of unique emoji keys seen by this collector.
   */
  public get uniqueReactions(): number {
    return this._reactions.size;
  }

  /**
   * Gets the total number of reactions seen by this collector.
   */
  public get totalReactions(): number {
    let total = 0;
    for (const count of this._reactions.values()) {
      total += count;
    }
    return total;
  }

  /**
   * Creates a reaction collector for a message.
   * @param client - The client instance.
   * @param messageId - The message ID to collect reactions from.
   * @param options - Collector options.
   * @returns A new reaction collector.
   */
  public static createMessageCollector(
    client: Client,
    messageId: string,
    options?: Omit<ReactionCollectorOptions, "messageId">,
  ): ReactionCollector {
    return new ReactionCollector(client, { ...options, messageId });
  }

  /**
   * Creates a reaction collector for an emoji.
   * @param client - The client instance.
   * @param emoji - The emoji ID or name to collect.
   * @param options - Collector options.
   * @returns A new reaction collector.
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
