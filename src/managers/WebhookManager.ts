import type { APIWebhook } from "discord-api-types/v10";
import type Client from "../client";
import type { WebhookStructureInstance } from "../structures/WebhookStructure";
import WebhookStructure from "../structures/WebhookStructure";
import Cache from "../utils/cache";

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
      `/webhooks/${webhookId}${options?.token ? `/${options.token}` : ""}`,
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
        if (webhook.channelId === channelId) {
          cached.push(webhook);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const webhooks = (await this.client.rest.get(`/channels/${channelId}/webhooks`)) as
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
        if (webhook.guildId === guildId) {
          cached.push(webhook);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const webhooks = (await this.client.rest.get(`/guilds/${guildId}/webhooks`)) as
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

  public async create(
    channelId: string,
    options: { name: string; avatar?: string; reason?: string },
  ): Promise<WebhookStructureInstance | null> {
    const webhook = (await this.client.rest.post(`/channels/${channelId}/webhooks`, {
      body: {
        name: options.name,
        avatar: options.avatar,
      },
      reason: options.reason,
    })) as APIWebhook | null;

    if (!webhook) {
      return null;
    }

    const webhookStructure = new WebhookStructure(webhook, this.client);
    this._add(webhookStructure, { enabled: true, force: false });
    return webhookStructure;
  }

  public async edit(
    webhookId: string,
    options: { name?: string; avatar?: string; channel?: string; reason?: string },
    token?: string,
  ): Promise<WebhookStructureInstance | null> {
    const webhook = (await this.client.rest.patch(
      `/webhooks/${webhookId}${token ? `/${token}` : ""}`,
      {
        body: {
          name: options.name,
          avatar: options.avatar,
          channel_id: options.channel,
        },
        reason: options.reason,
      },
    )) as APIWebhook | null;

    if (!webhook) {
      return null;
    }

    const webhookStructure = new WebhookStructure(webhook, this.client);
    this._add(webhookStructure, { enabled: true, force: true });
    return webhookStructure;
  }

  public async delete(webhookId: string, token?: string, reason?: string): Promise<void> {
    await this.client.rest.delete(`/webhooks/${webhookId}${token ? `/${token}` : ""}`, {
      reason,
    });
    this._remove(webhookId);
  }

  public get cache(): Cache<string, WebhookStructureInstance> {
    return this._cache;
  }
}
