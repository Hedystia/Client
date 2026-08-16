import {
  type APIMessageComponentButtonInteraction,
  type APIMessageComponentInteraction,
  type APIMessageComponentSelectMenuInteraction,
  ComponentType,
  InteractionType,
} from "discord-api-types/v10";
import type Client from "../client";
import type { InteractionStructureInstance } from "../structures/InteractionStructure";
import type { CollectorOptions } from "./Collector";
import Collector from "./Collector";

/**
 * A Discord message-component interaction.
 *
 * This alias intentionally exposes the official discord-api-types payload rather than
 * maintaining a second handwritten interaction model.
 */
export type ButtonInteraction = APIMessageComponentButtonInteraction;
export type SelectMenuInteraction = APIMessageComponentSelectMenuInteraction;
export type ComponentInteraction = APIMessageComponentInteraction;

/**
 * Options used to filter message-component interactions.
 */
export interface InteractionCollectorOptions extends CollectorOptions<ComponentInteraction> {
  /** Message ID to filter interactions. */
  messageId?: string;
  /** Channel ID to filter interactions. */
  channelId?: string;
  /** Guild ID to filter interactions. */
  guildId?: string;
  /** User ID to filter interactions. */
  userId?: string;
  /** Custom IDs to filter interactions. */
  customId?: string | string[];
  /** Component type to filter interactions. */
  componentType?:
    | ComponentType.Button
    | ComponentType.StringSelect
    | ComponentType.UserSelect
    | ComponentType.RoleSelect
    | ComponentType.MentionableSelect
    | ComponentType.ChannelSelect;
}

/**
 * Collects Discord message-component interactions.
 */
class InteractionCollector extends Collector<string, ComponentInteraction, [ComponentInteraction]> {
  private readonly options: InteractionCollectorOptions;
  private readonly interactionListener = (interaction: InteractionStructureInstance): void => {
    if (interaction.type === InteractionType.MessageComponent) {
      this.handle(interaction as unknown as ComponentInteraction).catch(() => undefined);
    }
  };

  /**
   * @param client - The client instance that owns the collector.
   * @param options - Interaction filtering and lifecycle options.
   */
  public constructor(client: Client, options: InteractionCollectorOptions = {}) {
    super(client, options);
    this.options = options;
    this.client.on("interactionCreate", this.interactionListener);
  }

  /**
   * Stops this collector and removes its client listener.
   * @param reason - The reason for stopping.
   */
  public override stop(reason = "user"): void {
    this.client.off("interactionCreate", this.interactionListener);
    super.stop(reason);
  }

  /**
   * Handles an incoming message-component interaction.
   * @param interaction - The official Discord interaction payload.
   * @returns Whether the interaction was collected.
   */
  public async handle(interaction: ComponentInteraction): Promise<boolean> {
    if (this.options.messageId && interaction.message.id !== this.options.messageId) {
      return false;
    }

    if (this.options.channelId && interaction.channel_id !== this.options.channelId) {
      return false;
    }

    if (this.options.guildId && interaction.guild_id !== this.options.guildId) {
      return false;
    }

    const userId = interaction.user?.id ?? interaction.member?.user.id;
    if (this.options.userId && userId !== this.options.userId) {
      return false;
    }

    if (this.options.customId) {
      const customId = interaction.data.custom_id;
      if (typeof this.options.customId === "string") {
        if (customId !== this.options.customId) {
          return false;
        }
      } else if (!this.options.customId.includes(customId)) {
        return false;
      }
    }

    if (
      this.options.componentType !== undefined &&
      interaction.data.component_type !== this.options.componentType
    ) {
      return false;
    }

    return super.handleWithArgs(interaction, interaction);
  }

  /**
   * Gets the key for an interaction.
   * @param interaction - The interaction whose ID should be used.
   * @returns The interaction ID.
   */
  protected getKey(interaction: ComponentInteraction): string {
    return interaction.id;
  }

  /**
   * Creates a collector for one button custom ID.
   * @param client - The client instance.
   * @param customId - The button custom ID.
   * @param options - Additional collector options.
   * @returns A button interaction collector.
   */
  public static createButtonCollector(
    client: Client,
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType">,
  ): InteractionCollector {
    return new InteractionCollector(client, {
      ...options,
      customId,
      componentType: ComponentType.Button,
    });
  }

  /**
   * Creates a collector for one string-select custom ID.
   * @param client - The client instance.
   * @param customId - The select-menu custom ID.
   * @param options - Additional collector options.
   * @returns A select-menu interaction collector.
   */
  public static createSelectMenuCollector(
    client: Client,
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType">,
  ): InteractionCollector {
    return new InteractionCollector(client, {
      ...options,
      customId,
      componentType: ComponentType.StringSelect,
    });
  }

  /**
   * Creates a collector for interactions attached to one message.
   * @param client - The client instance.
   * @param messageId - The message ID to collect from.
   * @param options - Additional collector options.
   * @returns A message component interaction collector.
   */
  public static createMessageCollector(
    client: Client,
    messageId: string,
    options?: Omit<InteractionCollectorOptions, "messageId">,
  ): InteractionCollector {
    return new InteractionCollector(client, { ...options, messageId });
  }
}

export default InteractionCollector;
