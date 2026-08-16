import type {
  APIMessage,
  APIWebhook,
  RESTDeleteAPIWebhookWithTokenMessageQuery,
  RESTGetAPIWebhookWithTokenMessageQuery,
  RESTPatchAPIWebhookJSONBody,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPatchAPIWebhookWithTokenMessageQuery,
  RESTPostAPIWebhookWithTokenGitHubQuery,
  RESTPostAPIWebhookWithTokenGitHubWaitResult,
  RESTPostAPIWebhookWithTokenJSONBody,
  RESTPostAPIWebhookWithTokenQuery,
  RESTPostAPIWebhookWithTokenSlackQuery,
  RESTPostAPIWebhookWithTokenSlackWaitResult,
  RESTPostAPIWebhookWithTokenWaitResult,
} from "discord-api-types/v10";
import { WebhookType } from "discord-api-types/v10";
import type Client from "../client";
import { CDN, ImageFormat, Routes } from "../utils/constants";
import type { ChannelStructureInstance } from "./ChannelStructure";
import type { MessageStructureInstance } from "./MessageStructure";
import MessageStructure from "./MessageStructure";
import type { UserStructureInstance } from "./UserStructure";
import UserStructure from "./UserStructure";

/**
 * Represents a Discord webhook and exposes convenient webhook methods.
 */
class WebhookStructure<T extends APIWebhook = APIWebhook> {
  public readonly client: Client;

  /**
   * The channel this webhook belongs to, when it is cached.
   */
  public get channel(): ChannelStructureInstance | null {
    const webhook = this as unknown as APIWebhook;
    return webhook.channel_id ? (this.client.channels.get(webhook.channel_id) ?? null) : null;
  }

  /**
   * The webhook's creation timestamp derived from its snowflake ID.
   */
  public get createdTimestamp(): number {
    const webhook = this as unknown as APIWebhook;
    return Number((BigInt(webhook.id) >> 22n) + 1420070400000n);
  }

  /**
   * The date this webhook was created.
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * Whether this is an incoming webhook.
   */
  public get isIncoming(): boolean {
    return (this as unknown as APIWebhook).type === WebhookType.Incoming;
  }

  /**
   * Whether this is a channel-follower webhook.
   */
  public get isChannelFollower(): boolean {
    return (this as unknown as APIWebhook).type === WebhookType.ChannelFollower;
  }

  /**
   * Whether this webhook was created by an application.
   */
  public get isApplicationCreated(): boolean {
    return (this as unknown as APIWebhook).type === WebhookType.Application;
  }

  /**
   * The user who created this webhook, when Discord returned one and it is cached.
   */
  public get owner(): UserStructureInstance | null {
    const user = (this as unknown as APIWebhook).user;
    if (!user) {
      return null;
    }
    const cached = this.client.users.cache.get(user.id);
    if (cached) {
      return cached;
    }
    const structure = new UserStructure(user, this.client) as UserStructureInstance;
    this.client.users._add(structure, { enabled: true, force: false });
    return structure;
  }

  /**
   * The webhook avatar URL.
   * @param options - Avatar formatting options.
   * @returns The avatar URL, or null when no custom avatar exists.
   */
  public avatarURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string | null {
    const webhook = this as unknown as APIWebhook;
    if (!webhook.avatar) {
      return null;
    }
    const size = options?.size ?? 1024;
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.userAvatar(webhook.id, webhook.avatar, extension as Parameters<typeof CDN.userAvatar>[2])}?size=${size}`;
  }

  /**
   * The webhook avatar URL, falling back to Discord's default webhook avatar.
   * @param options - Avatar formatting options.
   * @returns The avatar URL.
   */
  public displayAvatarURL(options?: Parameters<WebhookStructure["avatarURL"]>[0]): string {
    const webhook = this as unknown as APIWebhook;
    return (
      this.avatarURL(options) ??
      CDN.defaultUserAvatar(
        Number(BigInt(webhook.id) % 5n) as Parameters<typeof CDN.defaultUserAvatar>[0],
      )
    );
  }

  /**
   * The URL used to execute this webhook when a token is available.
   */
  public get url(): string | null {
    const webhook = this as unknown as APIWebhook;
    return (
      webhook.url ??
      (webhook.token
        ? `${this.client.rest.root}${Routes.webhook(webhook.id, webhook.token)}`
        : null)
    );
  }

  /**
   * Fetches the current webhook from Discord.
   * @returns The refreshed webhook, or null when Discord returned no data.
   */
  public fetch(): Promise<WebhookStructureInstance | null> {
    const webhook = this as unknown as APIWebhook;
    return this.client.webhooks.fetch(webhook.id, {
      cache: { force: true },
      token: webhook.token,
    });
  }

  /**
   * Creates a webhook structure.
   *
   * @param data - The official Discord webhook object.
   * @param client - The client instance.
   */
  public constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }

  /**
   * Edits this webhook using Discord's official webhook-edit body.
   *
   * @param data - The official Discord webhook-edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited webhook, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/webhook#modify-webhook
   */
  public edit(
    data: RESTPatchAPIWebhookJSONBody,
    reason?: string,
  ): Promise<WebhookStructureInstance | null> {
    const webhook = this as unknown as APIWebhook;
    return this.client.webhooks.edit(webhook.id, { ...data, reason }, webhook.token ?? undefined);
  }

  /**
   * Deletes this webhook.
   *
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/webhook#delete-webhook
   */
  public delete(reason?: string): Promise<void> {
    const webhook = this as unknown as APIWebhook;
    return this.client.webhooks.delete(webhook.id, webhook.token ?? undefined, reason);
  }

  /**
   * Sends a message through this webhook.
   *
   * @param content - A string or the official Discord webhook message body.
   * @param query - Optional official Discord webhook query fields.
   * @returns The created message, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/webhook#execute-webhook
   */
  public async send(
    content: string | RESTPostAPIWebhookWithTokenJSONBody | FormData,
    query?: RESTPostAPIWebhookWithTokenQuery,
  ): Promise<MessageStructureInstance | null> {
    const webhook = this as unknown as APIWebhook;
    if (!webhook.token) {
      throw new Error("This webhook does not have a token");
    }

    const body = typeof content === "string" ? { content } : content;
    const message = (await this.client.rest.post(Routes.webhook(webhook.id, webhook.token), {
      body,
      query: { ...serializeQuery(query), wait: "true" },
    })) as RESTPostAPIWebhookWithTokenWaitResult | null;
    if (!message) {
      return null;
    }

    return new MessageStructure(
      message,
      message.channel_id,
      webhook.guild_id ?? null,
      this.client,
    ) as unknown as MessageStructureInstance;
  }

  /**
   * Sends a Slack-compatible payload through this webhook.
   *
   * @param content - The Slack-compatible payload.
   * @param query - Optional official Slack-compatible webhook query fields.
   * @returns The created message, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/webhook#execute-slackcompatible-webhook
   */
  public async sendSlack(
    content: string,
    query?: RESTPostAPIWebhookWithTokenSlackQuery,
  ): Promise<MessageStructureInstance | null> {
    const webhook = this as unknown as APIWebhook;
    if (!webhook.token) {
      throw new Error("This webhook does not have a token");
    }
    const message = (await this.client.rest.post(
      Routes.webhookPlatform(webhook.id, webhook.token, "slack"),
      { query: { ...serializeQuery(query), wait: "true" }, body: content },
    )) as RESTPostAPIWebhookWithTokenSlackWaitResult | null;
    return message ? this.wrapMessage(message, webhook.guild_id ?? null) : null;
  }

  /**
   * Sends a GitHub-compatible payload through this webhook.
   *
   * @param content - The GitHub-compatible payload.
   * @param query - Optional official GitHub-compatible webhook query fields.
   * @returns The created message, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/webhook#execute-githubcompatible-webhook
   */
  public async sendGitHub(
    content: string,
    query?: RESTPostAPIWebhookWithTokenGitHubQuery,
  ): Promise<MessageStructureInstance | null> {
    const webhook = this as unknown as APIWebhook;
    if (!webhook.token) {
      throw new Error("This webhook does not have a token");
    }
    const message = (await this.client.rest.post(
      Routes.webhookPlatform(webhook.id, webhook.token, "github"),
      { query: { ...serializeQuery(query), wait: "true" }, body: content },
    )) as RESTPostAPIWebhookWithTokenGitHubWaitResult | null;
    return message ? this.wrapMessage(message, webhook.guild_id ?? null) : null;
  }

  /**
   * Fetches a message sent by this webhook.
   *
   * @param messageId - The message ID.
   * @param query - Optional official Discord webhook message query fields.
   * @returns The fetched message, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/webhook#get-webhook-message
   */
  public async fetchMessage(
    messageId: string,
    query?: RESTGetAPIWebhookWithTokenMessageQuery,
  ): Promise<MessageStructureInstance | null> {
    const webhook = this as unknown as APIWebhook;
    if (!webhook.token) {
      throw new Error("This webhook does not have a token");
    }

    const message = (await this.client.rest.get(
      Routes.webhookMessage(webhook.id, webhook.token, messageId),
      { query: serializeQuery(query) },
    )) as APIMessage | null;
    if (!message) {
      return null;
    }

    return this.wrapMessage(message, webhook.guild_id ?? null);
  }

  /**
   * Edits a message sent by this webhook.
   *
   * @param messageId - The message ID.
   * @param data - The official Discord webhook message-edit body.
   * @param query - Optional official Discord webhook message-edit query fields.
   * @returns The edited message, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/webhook#edit-webhook-message
   */
  public async editMessage(
    messageId: string,
    data: RESTPatchAPIWebhookWithTokenMessageJSONBody | FormData,
    query?: RESTPatchAPIWebhookWithTokenMessageQuery,
  ): Promise<MessageStructureInstance | null> {
    const webhook = this as unknown as APIWebhook;
    if (!webhook.token) {
      throw new Error("This webhook does not have a token");
    }

    const message = (await this.client.rest.patch(
      Routes.webhookMessage(webhook.id, webhook.token, messageId),
      { body: data, query: serializeQuery(query) },
    )) as APIMessage | null;
    if (!message) {
      return null;
    }

    return this.wrapMessage(message, webhook.guild_id ?? null);
  }

  /**
   * Wraps a webhook response message in the library's message structure.
   * @param message - The official message payload.
   * @param guildId - The webhook guild ID, if available.
   * @returns The wrapped message structure.
   */
  private wrapMessage(message: APIMessage, guildId: string | null): MessageStructureInstance {
    return new MessageStructure(
      message,
      message.channel_id,
      guildId,
      this.client,
    ) as unknown as MessageStructureInstance;
  }

  /**
   * Deletes a message sent by this webhook.
   *
   * @param messageId - The message ID.
   * @param query - Optional official Discord webhook message query fields.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/webhook#delete-webhook-message
   */
  public async deleteMessage(
    messageId: string,
    query?: RESTDeleteAPIWebhookWithTokenMessageQuery,
  ): Promise<void> {
    const webhook = this as unknown as APIWebhook;
    if (!webhook.token) {
      throw new Error("This webhook does not have a token");
    }

    await this.client.rest.delete(Routes.webhookMessage(webhook.id, webhook.token, messageId), {
      query: serializeQuery(query),
    });
  }
}

/**
 * Serializes an official Discord query object for the internal REST client.
 *
 * @param query - An official Discord query object.
 * @returns The REST client's string-valued query record.
 */
function serializeQuery(query?: object): Record<string, string> | undefined {
  if (!query) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
}

export default WebhookStructure as new <T extends APIWebhook = APIWebhook>(
  data: T,
  client: Client,
) => WebhookStructure<T> & T & { readonly client: Client };

export type WebhookStructureInstance = WebhookStructure & APIWebhook & { readonly client: Client };
