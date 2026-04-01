import type Client from "../client";
import type { CollectorOptions } from "./Collector";
import Collector from "./Collector";

export interface ButtonInteraction {
  id: string;
  type: 3; // Component interaction
  data: {
    component_type: 2; // Button
    custom_id: string;
  };
  message?: {
    id: string;
    channel_id: string;
    guild_id?: string;
  };
  user?: {
    id: string;
  };
  member?: {
    user: {
      id: string;
    };
  };
  token: string;
}

export interface SelectMenuInteraction {
  id: string;
  type: 3; // Component interaction
  data: {
    component_type: 3 | 5 | 6 | 7 | 8; // Select menu types
    custom_id: string;
    values?: string[];
  };
  message?: {
    id: string;
    channel_id: string;
    guild_id?: string;
  };
  user?: {
    id: string;
  };
  member?: {
    user: {
      id: string;
    };
  };
  token: string;
}

export type ComponentInteraction = ButtonInteraction | SelectMenuInteraction;

export interface InteractionCollectorOptions extends CollectorOptions<ComponentInteraction> {
  /** Message ID to filter interactions */
  messageId?: string;
  /** Channel ID to filter interactions */
  channelId?: string;
  /** Guild ID to filter interactions */
  guildId?: string;
  /** User ID to filter interactions */
  userId?: string;
  /** Custom IDs to filter interactions */
  customId?: string | string[];
  /** Component type to filter interactions (2 = Button, 3/5/6/7/8 = Select Menu) */
  componentType?: 2 | 3 | 5 | 6 | 7 | 8;
}

class InteractionCollector extends Collector<string, ComponentInteraction, [ComponentInteraction]> {
  private readonly options: InteractionCollectorOptions;

  constructor(client: Client, options: InteractionCollectorOptions = {}) {
    super(client, options);
    this.options = options;
  }

  /**
   * Handles incoming interactions
   * @param interaction - The interaction to handle
   * @returns Whether the interaction was collected
   */
  public async handle(interaction: ComponentInteraction): Promise<boolean> {
    // Filter by message ID
    if (this.options.messageId && interaction.message?.id !== this.options.messageId) {
      return false;
    }

    // Filter by channel ID
    if (this.options.channelId && interaction.message?.channel_id !== this.options.channelId) {
      return false;
    }

    // Filter by guild ID
    if (this.options.guildId && interaction.message?.guild_id !== this.options.guildId) {
      return false;
    }

    // Filter by user ID
    const userId = interaction.user?.id ?? interaction.member?.user.id;
    if (this.options.userId && userId !== this.options.userId) {
      return false;
    }

    // Filter by custom ID
    if (this.options.customId) {
      const customId = interaction.data.custom_id;
      if (!customId) {
        return false;
      }
      if (typeof this.options.customId === "string") {
        if (customId !== this.options.customId) {
          return false;
        }
      } else {
        if (!this.options.customId.includes(customId)) {
          return false;
        }
      }
    }

    // Filter by component type
    if (this.options.componentType !== undefined) {
      if (interaction.data.component_type !== this.options.componentType) {
        return false;
      }
    }

    return super.handleWithArgs(interaction, interaction);
  }

  /**
   * Gets the key for an interaction
   * @param interaction - The interaction to get the key for
   * @returns The interaction ID
   */
  protected getKey(interaction: ComponentInteraction): string {
    return interaction.id;
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
   * Creates a new button collector
   * @param client - The client instance
   * @param customId - The button's custom ID
   * @param options - Collector options
   * @returns A new interaction collector for buttons
   */
  public static createButtonCollector(
    client: Client,
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType">,
  ): InteractionCollector {
    return new InteractionCollector(client, {
      ...options,
      customId,
      componentType: 2, // Button component type
    });
  }

  /**
   * Creates a new select menu collector
   * @param client - The client instance
   * @param customId - The select menu's custom ID
   * @param options - Collector options
   * @returns A new interaction collector for select menus
   */
  public static createSelectMenuCollector(
    client: Client,
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType">,
  ): InteractionCollector {
    return new InteractionCollector(client, {
      ...options,
      customId,
      componentType: 3, // String select menu component type
    });
  }

  /**
   * Creates a new interaction collector for a message
   * @param client - The client instance
   * @param messageId - The message ID to collect interactions from
   * @param options - Collector options
   * @returns A new interaction collector
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
