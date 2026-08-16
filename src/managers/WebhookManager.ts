import type {
  APIWebhook,
  RESTPatchAPIWebhookJSONBody,
  RESTPostAPIChannelWebhookJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import type { WebhookStructureInstance } from "../structures/WebhookStructure";
import WebhookStructure from "../structures/WebhookStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

/** Options accepted when creating a webhook. */
export type WebhookCreateOptions = RESTPostAPIChannelWebhookJSONBody & {
  /** Optional audit-log reason. */
  reason?: string;
};

/** Options accepted when editing a webhook. */
export type WebhookEditOptions = RESTPatchAPIWebhookJSONBody & {
  /** Optional audit-log reason. */
  reason?: string;
};

export default class WebhookManager {
  client: Client;
  private readonly _cache = new Cache<string, WebhookStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(data: WebhookStructureInstance, cache: { enabled: boolean; force: boolean }): void {
    if (cache.enabled && data.id) {
      const webhook = this._cache.get(data.id);
      if (webhook && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  public _remove(id: string): void {
    this._cache.delete(id);
  }

  /**
   * Invalidates cached webhooks belonging to a channel after a gateway update.
   * @param channelId - The channel whose webhook cache should be refreshed.
   */
  public _removeChannel(channelId: string): void {
    for (const [webhookId, webhook] of this._cache.entries()) {
      if (webhook.channel_id === channelId) {
        this._cache.delete(webhookId);
      }
    }
  }

  public get(id: string): WebhookStructureInstance | undefined {
    return this._cache.get(id);
  }

  public async fetch(
    webhookId: string,
    options?: { cache?: { force: boolean }; token?: string },
  ): Promise<WebhookStructureInstance | null> {
    const cached = this._cache.get(webhookId);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const webhook = (await this.client.rest.get(
      Routes.webhook(webhookId, options?.token),
    )) as APIWebhook | null;

    if (!webhook) {
      return null;
    }

    const webhookStructure = new WebhookStructure(webhook, this.client);
    this._add(webhookStructure, { enabled: true, force: false });
    return webhookStructure;
  }

  public async fetchChannel(
    channelId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<WebhookStructureInstance[]> {
    const cached: WebhookStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const webhook of this._cache.values()) {
        if (webhook.channel_id === channelId) {
          cached.push(webhook);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const webhooks = (await this.client.rest.get(Routes.channelWebhooks(channelId))) as
      | APIWebhook[]
      | null;

    if (!webhooks) {
      return cached;
    }

    return webhooks.map((webhook) => {
      const webhookStructure = new WebhookStructure(webhook, this.client);
      this._add(webhookStructure, { enabled: true, force: false });
      return webhookStructure;
    });
  }

  public async fetchGuild(
    guildId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<WebhookStructureInstance[]> {
    const cached: WebhookStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const webhook of this._cache.values()) {
        if (webhook.guild_id === guildId) {
          cached.push(webhook);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const webhooks = (await this.client.rest.get(Routes.guildWebhooks(guildId))) as
      | APIWebhook[]
      | null;

    if (!webhooks) {
      return cached;
    }

    return webhooks.map((webhook) => {
      const webhookStructure = new WebhookStructure(webhook, this.client);
      this._add(webhookStructure, { enabled: true, force: false });
      return webhookStructure;
    });
  }

  /**
   * Creates a webhook in a channel.
   *
   * @param channelId - The channel ID.
   * @param options - The official Discord webhook body and optional audit-log reason.
   * @returns The created webhook, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/webhook#create-webhook
   */
  public async create(
    channelId: string,
    options: WebhookCreateOptions,
  ): Promise<WebhookStructureInstance | null> {
    const { reason, ...body } = options;
    const webhook = (await this.client.rest.post(Routes.channelWebhooks(channelId), {
      body,
      reason,
    })) as APIWebhook | null;

    if (!webhook) {
      return null;
    }

    const webhookStructure = new WebhookStructure(webhook, this.client);
    this._add(webhookStructure, { enabled: true, force: false });
    return webhookStructure;
  }

  /**
   * Edits a webhook.
   *
   * @param webhookId - The webhook ID.
   * @param options - The official Discord webhook edit body and optional audit-log reason.
   * @param token - Optional webhook token for token-authenticated editing.
   * @returns The edited webhook, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/webhook#modify-webhook
   */
  public async edit(
    webhookId: string,
    options: WebhookEditOptions,
    token?: string,
  ): Promise<WebhookStructureInstance | null> {
    const { reason, ...body } = options;
    const webhook = (await this.client.rest.patch(Routes.webhook(webhookId, token), {
      body,
      reason,
    })) as APIWebhook | null;

    if (!webhook) {
      return null;
    }

    const webhookStructure = new WebhookStructure(webhook, this.client);
    this._add(webhookStructure, { enabled: true, force: true });
    return webhookStructure;
  }

  public async delete(webhookId: string, token?: string, reason?: string): Promise<void> {
    await this.client.rest.delete(Routes.webhook(webhookId, token), {
      reason,
    });
    this._remove(webhookId);
  }

  public get cache(): Cache<string, WebhookStructureInstance> {
    return this._cache;
  }
}
