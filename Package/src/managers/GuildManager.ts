import type Client from "@/client";
import type { GuildStructureInstance } from "@/structures/GuildStructure";
import GuildStructure from "@/structures/GuildStructure";
import type { CacheAPIGuild } from "@/types/Cache";
import Cache from "@/utils/cache";
import { Routes } from "@/utils/constants";
import type { APIGuild } from "discord-api-types/v10";

export default class GuildManager {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Adds a guild to the cache
   * @param {GuildStructureInstance} data The guild data
   * @param {boolean} cache.enabled Whether to enable the guild in the cache
   * @param {boolean} cache.force Whether to force add the guild to the cache
   */
  public _add(
    data: GuildStructureInstance,
    cache: {
      enabled: boolean;
      force: boolean;
    },
  ): void {
    if (cache.enabled) {
      const guild = this.client.guilds.cache.get(data.id);
      if (guild && !cache.force) return;
      this.client.guilds.cache.set(data.id, data);
    }
  }

  /**
   * Fetches a guild from the API
   * @param {string} id The guild's id
   * @param {boolean} options.cache.force Whether to force fetch the guild from the API even if cache is enabled
   * @param {boolean} options.useStructure Whether to use the structure or the raw data
   * @link https://discord.com/developers/docs/resources/guild#guild-object
   * @returns {Promise<CacheAPIGuild | null>} The guild data
   */
  public async fetch(
    id: string,
    options?: {
      cache?: {
        force: boolean;
      };
      useStructure?: boolean;
    },
  ): Promise<APIGuild | CacheAPIGuild | null> {
    const guild = (await this.client.rest
      .get(Routes.guild(id))
      .catch(() => null)) as APIGuild | null;
    if (!guild) return null;
    if (options?.useStructure) {
      const guildStructure = this.transformStructure(this.client.guilds.transformPayload(guild));
      if (this.client.isCacheEnabled("guilds")) {
        this._add(guildStructure, {
          enabled: true,
          force: options?.cache?.force ?? false,
        });
      }
      return guildStructure;
    }
    return guild;
  }

  /**
   * Removes a guild from the cache
   * @param {string} id The guild's id
   */
  public _remove(id: string): void {
    this.client.guilds.cache.delete(id);
  }

  /**
   * Gets the guilds cache
   * @link https://discord.com/developers/docs/resources/guild#guild-object
   * @returns {Cache<string, GuildStructureInstance>} The guilds cache
   */
  public get cache(): Cache<string, CacheAPIGuild> {
    return new Cache<string, GuildStructureInstance>();
  }

  /**
   * Transforms a raw guild payload into a CacheAPIGuild
   * @param {APIGuild} data The raw guild payload
   * @link https://discord.com/developers/docs/resources/guild#guild-object
   * @returns {CacheAPIGuild} The transformed guild payload
   */
  public transformPayload<T extends APIGuild>(data: T): CacheAPIGuild {
    const transformed: CacheAPIGuild = {
      afk_channel_id: data.afk_channel_id,
      afk_timeout: data.afk_timeout,
      banner: data.banner,
      default_message_notifications: data.default_message_notifications,
      description: data.description,
      discovery_splash: data.discovery_splash,
      explicit_content_filter: data.explicit_content_filter,
      features: data.features,
      hub_type: data.hub_type,
      icon: data.icon,
      icon_hash: data.icon_hash,
      id: data.id,
      incidents_data: data.incidents_data,
      max_members: data.max_members,
      max_presences: data.max_presences,
      max_stage_video_channel_users: data.max_stage_video_channel_users,
      max_video_channel_users: data.max_video_channel_users,
      mfa_level: data.mfa_level,
      name: data.name,
      nsfw_level: data.nsfw_level,
      owner: data.owner,
      owner_id: data.owner_id,
      permissions: data.permissions,
      preferred_locale: data.preferred_locale,
      premium_progress_bar_enabled: data.premium_progress_bar_enabled,
      premium_subscription_count: data.premium_subscription_count,
      premium_tier: data.premium_tier,
      public_updates_channel_id: data.public_updates_channel_id,
      rules_channel_id: data.rules_channel_id,
      safety_alerts_channel_id: data.safety_alerts_channel_id,
      splash: data.splash,
      system_channel_flags: data.system_channel_flags,
      system_channel_id: data.system_channel_id,
      vanity_url_code: data.vanity_url_code,
      verification_level: data.verification_level,
      welcome_screen: data.welcome_screen,
      widget_channel_id: data.widget_channel_id,
      widget_enabled: data.widget_enabled,
    };
    return transformed;
  }

  /**
   * Transforms a raw guild payload into a GuildStructure
   * @param {CacheAPIGuild} data The raw guild payload
   * @link https://discord.com/developers/docs/resources/guild#guild-object
   * @returns {GuildStructureInstance} The transformed guild payload
   */
  public transformStructure<T extends CacheAPIGuild>(data: T): GuildStructureInstance {
    const transformed = new GuildStructure(data);
    return transformed;
  }
}
