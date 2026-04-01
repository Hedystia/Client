import type { GatewayGuildBanModifyDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import type { GuildBanStructureInstance } from "../structures/GuildBanStructure";
import GuildBanStructure from "../structures/GuildBanStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class GuildBanManager {
  client: Client;
  private readonly _cache = new Cache<string, GuildBanStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(data: GuildBanStructureInstance, cache: { enabled: boolean; force: boolean }): void {
    if (cache.enabled && data.userId) {
      const ban = this._cache.get(data.userId);
      if (ban && !cache.force) {
        return;
      }
      this._cache.set(data.userId, data);
    }
  }

  public _remove(userId: string): void {
    this._cache.delete(userId);
  }

  public get(userId: string): GuildBanStructureInstance | undefined {
    return this._cache.get(userId);
  }

  public async fetch(
    guildId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<GuildBanStructureInstance[]> {
    const cached: GuildBanStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const ban of this._cache.values()) {
        if (ban.guildId === guildId) {
          cached.push(ban);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const bans = (await this.client.rest.get(Routes.guildBans(guildId))) as
      | GatewayGuildBanModifyDispatchData[]
      | null;

    if (!bans) {
      return cached;
    }

    return bans.map((ban) => {
      const banStructure = new GuildBanStructure(ban, guildId, this.client);
      this._add(banStructure, { enabled: true, force: false });
      return banStructure;
    });
  }

  public async fetchOne(
    guildId: string,
    userId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<GuildBanStructureInstance | null> {
    const cached = this._cache.get(userId);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const ban = (await this.client.rest.get(
      Routes.guildBan(guildId, userId),
    )) as GatewayGuildBanModifyDispatchData | null;

    if (!ban) {
      return null;
    }

    const banStructure = new GuildBanStructure(ban, guildId, this.client);
    this._add(banStructure, { enabled: true, force: false });
    return banStructure;
  }

  public async create(
    guildId: string,
    userId: string,
    options?: { deleteMessageSeconds?: number; reason?: string },
  ): Promise<void> {
    const query = new URLSearchParams();
    if (options?.deleteMessageSeconds) {
      query.set("delete_message_seconds", options.deleteMessageSeconds.toString());
    }

    await this.client.rest.put(Routes.guildBan(guildId, userId), {
      query: Object.fromEntries(query),
      reason: options?.reason,
    });
  }

  public async remove(guildId: string, userId: string, reason?: string): Promise<void> {
    await this.client.rest.delete(Routes.guildBan(guildId, userId), {
      reason,
    });
    this._remove(userId);
  }

  public get cache(): Cache<string, GuildBanStructureInstance> {
    return this._cache;
  }
}
