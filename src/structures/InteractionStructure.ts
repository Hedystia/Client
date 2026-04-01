import type Client from "../client";
import type {
  ComponentInteraction,
  InteractionCollectorOptions,
} from "../collectors/InteractionCollector";
import InteractionCollector from "../collectors/InteractionCollector";
import { Routes } from "../utils/constants";

export type APIInteraction = ComponentInteraction & {
  id: string;
  type: number;
  data?: {
    custom_id?: string;
    component_type?: number;
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
};

class InteractionStructure<T extends APIInteraction = APIInteraction> {
  public readonly client: Client;
  public readonly id: string;
  public readonly type: number;
  public readonly data?: T["data"];
  public readonly message?: T["message"];
  public readonly user?: T["user"];
  public readonly member?: T["member"];
  public readonly token: string;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
    this.client = client;
    this.id = data.id;
    this.type = data.type;
    this.data = data.data;
    this.message = data.message;
    this.user = data.user;
    this.member = data.member;
    this.token = data.token;
  }

  /**
   * Checks if this interaction is from a button
   */
  public get isButton(): boolean {
    return this.data?.component_type === 2;
  }

  /**
   * Checks if this interaction is from a select menu
   */
  public get isSelectMenu(): boolean {
    return (
      this.data?.component_type !== undefined && [3, 5, 6, 7, 8].includes(this.data.component_type)
    );
  }

  /**
   * Checks if this interaction is from a message component
   */
  public get isMessageComponent(): boolean {
    return this.type === 3;
  }

  /**
   * Gets the custom ID of the interaction
   */
  public get customId(): string | undefined {
    return this.data?.custom_id;
  }

  /**
   * Gets the user ID who triggered the interaction
   */
  public get userId(): string | undefined {
    return this.user?.id ?? this.member?.user.id;
  }

  /**
   * Creates an interaction collector for additional interactions on the same message
   * @param options - Collector options
   * @returns A new interaction collector
   */
  public createMessageComponentCollector(
    options?: Omit<InteractionCollectorOptions, "messageId">,
  ): InteractionCollector {
    if (!this.message) {
      throw new Error("Cannot create collector: interaction has no message");
    }

    return new InteractionCollector(this.client, {
      ...options,
      messageId: this.message.id,
      channelId: this.message.channel_id,
      guildId: this.message.guild_id,
    });
  }

  /**
   * Creates a button collector for additional button interactions on the same message
   * @param customId - The button's custom ID to filter
   * @param options - Collector options
   * @returns A new interaction collector for buttons
   */
  public createButtonCollector(
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType" | "messageId">,
  ): InteractionCollector {
    if (!this.message) {
      throw new Error("Cannot create collector: interaction has no message");
    }

    return InteractionCollector.createButtonCollector(this.client, customId, {
      ...options,
      messageId: this.message.id,
    });
  }

  /**
   * Creates a select menu collector for additional select menu interactions on the same message
   * @param customId - The select menu's custom ID to filter
   * @param options - Collector options
   * @returns A new interaction collector for select menus
   */
  public createSelectMenuCollector(
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType" | "messageId">,
  ): InteractionCollector {
    if (!this.message) {
      throw new Error("Cannot create collector: interaction has no message");
    }

    return InteractionCollector.createSelectMenuCollector(this.client, customId, {
      ...options,
      messageId: this.message.id,
    });
  }

  /**
   * Checks if this interaction equals another interaction
   * @param interaction - The interaction to compare with
   * @returns Whether the interactions are equal
   */
  public equals(interaction: InteractionStructure): boolean {
    return this.id === interaction.id;
  }

  /**
   * Replies to an interaction (initial response)
   * @param content - The content to send
   * @returns A promise that resolves when the response is sent
   */
  public async reply(
    content:
      | string
      | {
          content?: string;
          embeds?: Array<{ title?: string; description?: string; color?: number }>;
          components?: Array<{ type: number; components?: unknown[] }>;
          flags?: number;
        },
  ): Promise<void> {
    const body = typeof content === "string" ? { content } : content;

    await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
      body: {
        type: 4, // ChannelMessageWithSource
        data: body,
      },
    });
  }

  /**
   * Defers the interaction response (shows "thinking..." state)
   * @param ephemeral - Whether the response should be ephemeral (only visible to the user)
   * @returns A promise that resolves when the defer is sent
   */
  public async defer(ephemeral = false): Promise<void> {
    await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
      body: {
        type: 5, // DeferredChannelMessageWithSource
        data: {
          flags: ephemeral ? 64 : 0,
        },
      },
    });
  }

  /**
   * Edits the original interaction response
   * @param content - The new content
   * @returns A promise that resolves when the edit is complete
   */
  public async editOriginal(
    content:
      | string
      | {
          content?: string;
          embeds?: Array<{ title?: string; description?: string; color?: number }>;
          components?: Array<{ type: number; components?: unknown[] }>;
        },
  ): Promise<void> {
    if (!this.client.me?.id) {
      throw new Error("Client is not logged in");
    }

    const body = typeof content === "string" ? { content } : content;

    await this.client.rest.patch(
      Routes.webhookMessage(this.client.me.id, this.token, "@original"),
      { body },
    );
  }

  /**
   * Deletes the original interaction response
   * @returns A promise that resolves when the deletion is complete
   */
  public async deleteOriginal(): Promise<void> {
    if (!this.client.me?.id) {
      throw new Error("Client is not logged in");
    }

    await this.client.rest.delete(
      Routes.webhookMessage(this.client.me.id, this.token, "@original"),
    );
  }

  /**
   * Sends a follow-up message to the interaction
   * @param content - The content to send
   * @returns A promise that resolves when the follow-up is sent
   */
  public async sendFollowUp(
    content:
      | string
      | {
          content?: string;
          embeds?: Array<{ title?: string; description?: string; color?: number }>;
          components?: Array<{ type: number; components?: unknown[] }>;
          ephemeral?: boolean;
        },
  ): Promise<void> {
    if (!this.client.me?.id) {
      throw new Error("Client is not logged in");
    }

    const body = typeof content === "string" ? { content } : content;
    const { ephemeral, ...rest } = body;

    await this.client.rest.post(Routes.webhook(this.client.me.id, this.token), {
      body: {
        ...rest,
        flags: ephemeral ? 64 : 0,
      },
    });
  }
}

export default InteractionStructure as new <T extends APIInteraction = APIInteraction>(
  data: T,
  client: Client,
) => InteractionStructure<T> & T & { readonly client: Client };

export type InteractionStructureInstance = InteractionStructure &
  APIInteraction & { readonly client: Client };
