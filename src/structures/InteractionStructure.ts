import {
  type APIApplicationCommandInteraction,
  type APICommandAutocompleteInteractionResponseCallbackData,
  type APIInteraction as APIInteractionPayload,
  type APIInteractionResponseCallbackData,
  type APIMessage,
  type APIMessageComponentInteraction,
  type APIModalInteractionResponseCallbackData,
  type APIModalSubmitInteraction,
  ApplicationCommandType,
  ComponentType,
  InteractionResponseType,
  InteractionType,
  type RESTGetAPIInteractionOriginalResponseResult,
  type RESTPatchAPIInteractionOriginalResponseJSONBody,
  type RESTPatchAPIInteractionOriginalResponseResult,
  type RESTPostAPIInteractionCallbackWithResponseResult,
  type RESTPostAPIInteractionFollowupJSONBody,
  type RESTPostAPIInteractionFollowupResult,
} from "discord-api-types/v10";
import type Client from "../client";
import type {
  ComponentInteraction,
  InteractionCollectorOptions,
} from "../collectors/InteractionCollector";
import InteractionCollector from "../collectors/InteractionCollector";
import { Routes } from "../utils/constants";
import type { MessageStructureInstance } from "./MessageStructure";
import MessageStructure from "./MessageStructure";

/**
 * Any interaction payload delivered by the Discord gateway.
 *
 * This alias is provided by `discord-api-types/v10`; no local interaction
 * payload model is maintained by the library.
 */
export type APIInteraction = APIInteractionPayload;

type InteractionMessageInput =
  | string
  | (APIInteractionResponseCallbackData & {
      /** Whether the response should be visible only to the invoking user. */
      ephemeral?: boolean;
    });
type FollowUpMessageInput =
  | string
  | (RESTPostAPIInteractionFollowupJSONBody & {
      /** Whether the follow-up should be ephemeral. */
      ephemeral?: boolean;
    });

/**
 * A high-level wrapper around an official Discord interaction payload.
 *
 * The wrapper keeps the original payload fields available while adding
 * response methods and interaction-specific convenience accessors.
 *
 * @template T - The official Discord interaction payload type.
 */
class InteractionStructure<T extends APIInteraction = APIInteraction> {
  public readonly client: Client;
  public readonly id: string;
  public readonly type: T["type"];
  public readonly data?: T["data"];
  public readonly message?: T["message"];
  public readonly user?: T["user"];
  public readonly member?: T["member"];
  public readonly token: string;
  public readonly applicationId: string;
  public readonly guildId?: string;
  public readonly channelId?: T["channel_id"];
  private readonly payload: T;
  private responded = false;

  /**
   * @param data - The official Discord interaction payload.
   * @param client - The client instance that received the interaction.
   */
  public constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.payload = data;
    this.client = client;
    this.id = data.id;
    this.type = data.type;
    this.data = data.data;
    this.message = data.message;
    this.user = data.user;
    this.member = data.member;
    this.token = data.token;
    this.applicationId = data.application_id;
    this.guildId = data.guild_id;
    this.channelId = data.channel_id;
  }

  /**
   * Whether this is a chat-input slash-command interaction.
   */
  public get isChatInputCommand(): boolean {
    const data = this.data;
    return (
      this.type === InteractionType.ApplicationCommand &&
      data !== undefined &&
      "type" in data &&
      data.type === ApplicationCommandType.ChatInput
    );
  }

  /**
   * Whether this is a user or message context-menu command interaction.
   */
  public get isContextMenuCommand(): boolean {
    const data = this.data;
    return (
      this.type === InteractionType.ApplicationCommand &&
      data !== undefined &&
      "type" in data &&
      (data.type === ApplicationCommandType.User || data.type === ApplicationCommandType.Message)
    );
  }

  /**
   * Whether this is an autocomplete interaction.
   */
  public get isAutocomplete(): boolean {
    return this.type === InteractionType.ApplicationCommandAutocomplete;
  }

  /**
   * Whether this is a modal-submit interaction.
   */
  public get isModalSubmit(): boolean {
    return this.type === InteractionType.ModalSubmit;
  }

  /**
   * Whether this is a ping interaction.
   */
  public get isPing(): boolean {
    return this.type === InteractionType.Ping;
  }

  /**
   * Whether this interaction was triggered by a button.
   */
  public get isButton(): boolean {
    return this.isMessageComponent && this.componentData.component_type === ComponentType.Button;
  }

  /**
   * Whether this interaction was triggered by any select menu.
   */
  public get isSelectMenu(): boolean {
    if (!this.isMessageComponent) {
      return false;
    }
    return [
      ComponentType.StringSelect,
      ComponentType.UserSelect,
      ComponentType.RoleSelect,
      ComponentType.MentionableSelect,
      ComponentType.ChannelSelect,
    ].includes(this.componentData.component_type);
  }

  /**
   * Whether this is a message-component interaction.
   */
  public get isMessageComponent(): boolean {
    return this.type === InteractionType.MessageComponent;
  }

  /**
   * Gets the application command name, when this interaction contains one.
   */
  public get commandName(): string | null {
    if (!this.isChatInputCommand && !this.isContextMenuCommand && !this.isAutocomplete) {
      return null;
    }
    return (this.data as APIApplicationCommandInteraction["data"]).name;
  }

  /**
   * Gets the component or modal custom ID.
   */
  public get customId(): string {
    if (this.isMessageComponent) {
      return this.componentData.custom_id;
    }
    if (this.isModalSubmit) {
      return (this.data as APIModalSubmitInteraction["data"]).custom_id;
    }
    return "";
  }

  /**
   * Gets values submitted by a select menu or modal component.
   *
   * @returns The selected values, or an empty array when the interaction does
   * not contain values.
   */
  public get values(): string[] {
    if (this.isMessageComponent) {
      const data = this.componentData;
      return "values" in data ? data.values : [];
    }
    return [];
  }

  /**
   * Gets the value of a text input submitted by a modal.
   *
   * @param customId - The text-input custom ID.
   * @returns The submitted value, or null when no matching text input exists.
   */
  public getTextInputValue(customId: string): string | null {
    if (!this.isModalSubmit) {
      return null;
    }

    const data = this.data as APIModalSubmitInteraction["data"];
    for (const container of data.components) {
      const components =
        "components" in container
          ? container.components
          : "component" in container
            ? [container.component]
            : [];
      for (const component of components) {
        if (
          component.custom_id === customId &&
          "value" in component &&
          typeof component.value === "string"
        ) {
          return component.value;
        }
      }
    }
    return null;
  }

  /**
   * Gets the ID of the user who triggered the interaction.
   */
  public get userId(): string | undefined {
    return this.user?.id ?? this.member?.user.id;
  }

  /**
   * Creates a collector for additional interactions on the same message.
   * @param options - Collector options.
   * @returns A new interaction collector.
   */
  public createMessageComponentCollector(
    options?: Omit<InteractionCollectorOptions, "messageId">,
  ): InteractionCollector {
    if (!this.message) {
      throw new Error("This interaction is not attached to a message");
    }
    return new InteractionCollector(this.client, {
      ...options,
      messageId: this.message.id,
      channelId: this.channelId,
      guildId: this.guildId,
    });
  }

  /**
   * Creates a button collector for the same message.
   * @param customId - The button custom ID to match.
   * @param options - Additional collector options.
   * @returns A new button interaction collector.
   */
  public createButtonCollector(
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType" | "messageId">,
  ): InteractionCollector {
    if (!this.message) {
      throw new Error("This interaction is not attached to a message");
    }
    return InteractionCollector.createButtonCollector(this.client, customId, {
      ...options,
      messageId: this.message.id,
    });
  }

  /**
   * Creates a select-menu collector for the same message.
   * @param customId - The select-menu custom ID to match.
   * @param options - Additional collector options.
   * @returns A new select-menu interaction collector.
   */
  public createSelectMenuCollector(
    customId: string,
    options?: Omit<InteractionCollectorOptions, "customId" | "componentType" | "messageId">,
  ): InteractionCollector {
    if (!this.message) {
      throw new Error("This interaction is not attached to a message");
    }
    return InteractionCollector.createSelectMenuCollector(this.client, customId, {
      ...options,
      messageId: this.message.id,
    });
  }

  /**
   * Checks whether this interaction has the same ID as another one.
   * @param interaction - The interaction to compare with.
   * @returns Whether both interactions have the same ID.
   */
  public equals(interaction: InteractionStructure): boolean {
    return this.id === interaction.id;
  }

  /**
   * Sends the initial interaction response.
   * @param content - A message string or an official Discord callback data body.
   * @returns The created response message when Discord returns one.
   */
  public async reply(
    content: InteractionMessageInput | FormData,
  ): Promise<MessageStructureInstance | null> {
    this.assertInitialResponseAvailable();
    const body =
      typeof content === "string" || content instanceof FormData
        ? typeof content === "string"
          ? { content }
          : content
        : this.normalizeMessageData(content);
    return this.sendCallback(
      {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: body,
      },
      true,
    );
  }

  /**
   * Defers the initial interaction response.
   * @param ephemeral - Whether the eventual response should be visible only to the user.
   */
  public async defer(ephemeral = false): Promise<void> {
    this.assertInitialResponseAvailable();
    await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
      body: {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: ephemeral ? { flags: 64 } : undefined,
      },
    });
    this.responded = true;
  }

  /**
   * Alias for {@link InteractionStructure.defer}.
   * @param ephemeral - Whether the eventual response should be ephemeral.
   */
  public deferReply(ephemeral = false): Promise<void> {
    return this.defer(ephemeral);
  }

  /**
   * Defers a component interaction while keeping its message unchanged.
   */
  public async deferUpdate(): Promise<void> {
    this.assertInitialResponseAvailable();
    await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
      body: { type: InteractionResponseType.DeferredMessageUpdate },
    });
    this.responded = true;
  }

  /**
   * Updates the message attached to a component interaction.
   * @param content - The official interaction message body.
   */
  public async update(
    content: string | APIInteractionResponseCallbackData | FormData,
  ): Promise<MessageStructureInstance | null> {
    this.assertInitialResponseAvailable();
    const body = typeof content === "string" ? { content } : content;
    return this.sendCallback(
      {
        type: InteractionResponseType.UpdateMessage,
        data: body,
      },
      true,
    );
  }

  /**
   * Responds to an autocomplete interaction.
   * @param data - Official autocomplete choices.
   */
  public async respond(data: APICommandAutocompleteInteractionResponseCallbackData): Promise<void> {
    this.assertInitialResponseAvailable();
    await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
      body: {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data,
      },
    });
    this.responded = true;
  }

  /**
   * Acknowledges a ping interaction.
   */
  public async pong(): Promise<void> {
    this.assertInitialResponseAvailable();
    await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
      body: { type: InteractionResponseType.Pong },
    });
    this.responded = true;
  }

  /**
   * Whether an initial response has been sent through this wrapper.
   */
  public get replied(): boolean {
    return this.responded;
  }

  /**
   * Edits the original interaction response.
   * @param content - A message string or an official Discord edit body.
   * @returns The edited response message, or null when Discord returned no data.
   */
  public async editOriginal(
    content: string | RESTPatchAPIInteractionOriginalResponseJSONBody | FormData,
  ): Promise<MessageStructureInstance | null> {
    const message = (await this.client.rest.patch(
      Routes.webhookMessage(this.applicationId, this.token, "@original"),
      {
        body: typeof content === "string" ? { content } : content,
      },
    )) as RESTPatchAPIInteractionOriginalResponseResult | null;
    return message ? this.wrapMessage(message) : null;
  }

  /**
   * Fetches the original interaction response.
   */
  public async fetchOriginal(): Promise<MessageStructureInstance | null> {
    const message = (await this.client.rest.get(
      Routes.webhookMessage(this.applicationId, this.token, "@original"),
    )) as RESTGetAPIInteractionOriginalResponseResult | null;
    return message ? this.wrapMessage(message) : null;
  }

  /**
   * Fetches the original interaction response.
   */
  public fetchReply(): Promise<MessageStructureInstance | null> {
    return this.fetchOriginal();
  }

  /**
   * Edits the original interaction response.
   * @param content - The new response content.
   */
  public editReply(
    content: string | RESTPatchAPIInteractionOriginalResponseJSONBody | FormData,
  ): Promise<MessageStructureInstance | null> {
    return this.editOriginal(content);
  }

  /**
   * Deletes the original interaction response.
   */
  public async deleteReply(): Promise<void> {
    await this.deleteOriginal();
  }

  /**
   * Deletes the original interaction response.
   */
  public async deleteOriginal(): Promise<void> {
    await this.client.rest.delete(
      Routes.webhookMessage(this.applicationId, this.token, "@original"),
    );
  }

  /**
   * Sends a follow-up message for the interaction.
   * @param content - A message string or an official follow-up body with the ergonomic `ephemeral` flag.
   * @returns The created follow-up message, or null when Discord returned no data.
   */
  public async sendFollowUp(
    content: FollowUpMessageInput | FormData,
  ): Promise<MessageStructureInstance | null> {
    const body = content;
    const ephemeral =
      !(body instanceof FormData) && typeof body !== "string" ? body.ephemeral : undefined;
    const followUpBody =
      typeof body === "string" || body instanceof FormData
        ? typeof body === "string"
          ? { content: body }
          : body
        : (() => {
            const { ephemeral: _ephemeral, ...rest } = body;
            return { ...rest, flags: ephemeral ? 64 : rest.flags };
          })();
    const message = (await this.client.rest.post(Routes.webhook(this.applicationId, this.token), {
      query: { wait: true },
      body: followUpBody,
    })) as RESTPostAPIInteractionFollowupResult | null;
    return message ? this.wrapMessage(message) : null;
  }

  /**
   * Alias for {@link InteractionStructure.sendFollowUp}.
   * @param content - A message string or an official follow-up body.
   */
  public followUp(
    content: FollowUpMessageInput | FormData,
  ): Promise<MessageStructureInstance | null> {
    return this.sendFollowUp(content);
  }

  /**
   * Displays a modal as the initial interaction response.
   * @param data - The official modal callback data.
   */
  public async showModal(data: APIModalInteractionResponseCallbackData): Promise<void> {
    this.assertInitialResponseAvailable();
    await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
      body: {
        type: InteractionResponseType.Modal,
        data,
      },
    });
    this.responded = true;
  }

  /**
   * Launches the application's associated Activity.
   */
  public async launchActivity(): Promise<void> {
    this.assertInitialResponseAvailable();
    await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
      body: { type: InteractionResponseType.LaunchActivity },
    });
    this.responded = true;
  }

  /**
   * Normalizes the ergonomic ephemeral flag into Discord's official message flags.
   */
  private normalizeMessageData(
    data: APIInteractionResponseCallbackData & { ephemeral?: boolean },
  ): APIInteractionResponseCallbackData {
    const { ephemeral, ...rest } = data;
    return ephemeral ? { ...rest, flags: 64 } : rest;
  }

  /**
   * Ensures that only one initial interaction response is sent.
   */
  private assertInitialResponseAvailable(): void {
    if (this.responded) {
      throw new Error("This interaction has already been acknowledged");
    }
  }

  /**
   * Sends an initial interaction callback and optionally wraps the returned message.
   */
  private async sendCallback(
    body: {
      type: InteractionResponseType;
      data?: APIInteractionResponseCallbackData | FormData;
    },
    withMessage: boolean,
  ): Promise<MessageStructureInstance | null> {
    const callbackBody =
      body.data instanceof FormData ? this.createMultipartCallback(body.type, body.data) : body;
    const result = (await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
      query: withMessage ? { with_response: true } : undefined,
      body: callbackBody,
    })) as RESTPostAPIInteractionCallbackWithResponseResult | null;
    this.responded = true;
    const message = result?.resource?.message;
    return message ? this.wrapMessage(message) : null;
  }

  /**
   * Converts a native multipart form into Discord's callback multipart shape.
   */
  private createMultipartCallback(type: InteractionResponseType, form: FormData): FormData {
    const callback = new FormData();
    for (const [key, value] of form.entries()) {
      callback.append(key, value);
    }

    const payload = form.get("payload_json");
    const data = typeof payload === "string" ? JSON.parse(payload) : {};
    callback.set("payload_json", JSON.stringify({ type, data }));
    return callback;
  }

  /**
   * Returns the official component payload after validating its interaction type.
   */
  private get componentData(): APIMessageComponentInteraction["data"] {
    if (!this.isMessageComponent) {
      throw new Error("This interaction is not a message component");
    }
    return (this.payload as APIMessageComponentInteraction).data;
  }

  /**
   * Wraps an official message payload in the library's message structure.
   */
  private wrapMessage(message: APIMessage): MessageStructureInstance {
    return new MessageStructure(
      message,
      message.channel_id,
      this.guildId ?? null,
      this.client,
    ) as unknown as MessageStructureInstance;
  }
}

export default InteractionStructure as new <T extends APIInteraction = APIInteraction>(
  data: T,
  client: Client,
) => InteractionStructure<T> & T & { readonly client: Client };

export type InteractionStructureInstance = InteractionStructure &
  APIInteraction & { readonly client: Client };

export type { ComponentInteraction };
