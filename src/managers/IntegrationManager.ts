import type { APIGuildIntegration } from "discord-api-types/v10";
import type Client from "../client";
import type { IntegrationStructureInstance } from "../structures/IntegrationStructure";
import IntegrationStructure from "../structures/IntegrationStructure";
import Cache from "../utils/cache";

export default class IntegrationManager {
  client: Client;
  private readonly _cache = new Cache<string, IntegrationStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(
    data: IntegrationStructureInstance,
    cache: { enabled: boolean; force: boolean },
  ): void {
    if (cache.enabled) {
      const integration = this._cache.get(data.id);
      if (integration && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  public _remove(id: string): void {
    this._cache.delete(id);
  }

  public get(id: string): IntegrationStructureInstance | undefined {
    return this._cache.get(id);
  }

  public async fetch(
    guildId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<IntegrationStructureInstance[]> {
    const cached: IntegrationStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const integration of this._cache.values()) {
        if (integration.guildId === guildId) {
          cached.push(integration);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const integrations = (await this.client.rest.get(`/guilds/${guildId}/integrations`)) as
      | APIGuildIntegration[]
      | null;

    if (!integrations) {
      return cached;
    }

    return integrations.map((integration) => {
      const integrationStructure = new IntegrationStructure(integration, guildId, this.client);
      this._add(integrationStructure, { enabled: true, force: false });
      return integrationStructure;
    });
  }

  public async delete(guildId: string, integrationId: string): Promise<void> {
    await this.client.rest.delete(`/guilds/${guildId}/integrations/${integrationId}`);
    this._remove(integrationId);
  }

  public get cache(): Cache<string, IntegrationStructureInstance> {
    return this._cache;
  }
}
