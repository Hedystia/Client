import type {
  APIGuild,
  RESTGetAPIAuditLogQuery,
  RESTGetAPIAuditLogResult,
  RESTGetAPIGuildChannelsResult,
  RESTGetAPIGuildInvitesResult,
  RESTGetAPIGuildMembersSearchQuery,
  RESTGetAPIGuildMembersSearchResult,
  RESTGetAPIGuildMemberVerificationResult,
  RESTGetAPIGuildMessagesSearchQuery,
  RESTGetAPIGuildMessagesSearchResult,
  RESTGetAPIGuildOnboardingResult,
  RESTGetAPIGuildPreviewResult,
  RESTGetAPIGuildPruneCountQuery,
  RESTGetAPIGuildPruneCountResult,
  RESTGetAPIGuildQuery,
  RESTGetAPIGuildRoleMemberCountsResult,
  RESTGetAPIGuildThreadsResult,
  RESTGetAPIGuildVanityUrlResult,
  RESTGetAPIGuildVoiceRegionsResult,
  RESTGetAPIGuildWelcomeScreenResult,
  RESTGetAPIGuildWidgetImageQuery,
  RESTGetAPIGuildWidgetImageResult,
  RESTGetAPIGuildWidgetJSONResult,
  RESTGetAPIGuildWidgetSettingsResult,
  RESTPatchAPIGuildChannelPositionsJSONBody,
  RESTPatchAPIGuildChannelPositionsResult,
  RESTPatchAPIGuildJSONBody,
  RESTPatchAPIGuildMemberVerificationJSONBody,
  RESTPatchAPIGuildMemberVerificationResult,
  RESTPatchAPIGuildWelcomeScreenJSONBody,
  RESTPatchAPIGuildWidgetSettingsJSONBody,
  RESTPostAPIGuildChannelJSONBody,
  RESTPostAPIGuildChannelResult,
  RESTPostAPIGuildPruneJSONBody,
  RESTPostAPIGuildPruneResult,
  RESTPostAPIGuildsJSONBody,
  RESTPostAPIGuildsResult,
  RESTPutAPIGuildIncidentActionsJSONBody,
  RESTPutAPIGuildIncidentActionsResult,
  RESTPutAPIGuildOnboardingJSONBody,
  RESTPutAPIGuildOnboardingResult,
} from "discord-api-types/v10";
import type Client from "../client";
import type { AuditLogStructureInstance } from "../structures/AuditLogStructure";
import AuditLogStructure from "../structures/AuditLogStructure";
import type { GuildStructureInstance } from "../structures/GuildStructure";
import GuildStructure from "../structures/GuildStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class GuildManager {
  client: Client;
  private readonly _cache = new Cache<string, GuildStructureInstance>();

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
      if (guild && !cache.force) {
        return;
      }
      this.client.guilds.cache.set(data.id, data);
    }
  }

  /**
   * Fetches a guild from the API
   * @param {string} id The guild's id
   * @param {boolean} options.cache.force Whether to force fetch the guild from the API even if cache is enabled
   * @link https://discord.com/developers/docs/resources/guild#guild-object
   * @returns {Promise<GuildStructureInstance | null>} The guild data
   */
  public async fetch(
    id: string,
    options?: {
      cache?: {
        force: boolean;
      };
      withCounts?: boolean;
    },
  ): Promise<GuildStructureInstance | null> {
    const query: RESTGetAPIGuildQuery | undefined =
      options?.withCounts === undefined ? undefined : { with_counts: options.withCounts };
    const guild = (await this.client.rest
      .get(Routes.guild(id), {
        query: query ? { with_counts: String(query.with_counts) } : undefined,
      })
      .catch(() => null)) as APIGuild | null;
    if (!guild) {
      return null;
    }
    const guildStructure = new GuildStructure(guild, this.client);
    this._add(guildStructure, {
      enabled: true,
      force: options?.cache?.force ?? false,
    });
    return guildStructure;
  }

  /**
   * Creates a guild owned by the current user.
   *
   * Discord has deprecated this endpoint for new applications; it remains
   * available here because it is still part of the official REST surface.
   *
   * @param data - The official guild-create body.
   * @returns The created guild, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#create-guild
   */
  public async create(data: RESTPostAPIGuildsJSONBody): Promise<GuildStructureInstance | null> {
    const guild = (await this.client.rest.post(Routes.guilds(), {
      body: data,
    })) as RESTPostAPIGuildsResult | null;
    if (!guild) {
      return null;
    }
    const structure = new GuildStructure(guild, this.client) as unknown as GuildStructureInstance;
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Fetches a guild preview.
   *
   * @param guildId - The guild ID.
   * @returns The official guild-preview payload, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-preview
   */
  public async fetchPreview(guildId: string): Promise<RESTGetAPIGuildPreviewResult | null> {
    return (await this.client.rest.get(
      Routes.guildPreview(guildId),
    )) as RESTGetAPIGuildPreviewResult | null;
  }

  /**
   * Fetches membership-screening settings for a guild.
   *
   * @param guildId - The guild ID.
   * @returns The official membership-screening payload.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-member-verification
   */
  public async fetchMemberVerification(
    guildId: string,
  ): Promise<RESTGetAPIGuildMemberVerificationResult | null> {
    return (await this.client.rest.get(
      Routes.guildMemberVerification(guildId),
    )) as RESTGetAPIGuildMemberVerificationResult | null;
  }

  /**
   * Edits membership-screening settings for a guild.
   *
   * @param guildId - The guild ID.
   * @param data - The official membership-screening body.
   * @returns The updated membership-screening payload.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-member-verification
   */
  public async editMemberVerification(
    guildId: string,
    data: RESTPatchAPIGuildMemberVerificationJSONBody,
  ): Promise<RESTPatchAPIGuildMemberVerificationResult | null> {
    return (await this.client.rest.patch(Routes.guildMemberVerification(guildId), {
      body: data,
    })) as RESTPatchAPIGuildMemberVerificationResult | null;
  }

  /**
   * Updates temporary guild incident restrictions.
   *
   * @param guildId - The guild ID.
   * @param data - The official incident-actions body.
   * @returns The updated incident state.
   * @see https://docs.discord.com/developers/resources/guild#modify-incidents-actions
   */
  public async editIncidentActions(
    guildId: string,
    data: RESTPutAPIGuildIncidentActionsJSONBody,
  ): Promise<RESTPutAPIGuildIncidentActionsResult | null> {
    return (await this.client.rest.put(Routes.guildIncidentActions(guildId), {
      body: data,
    })) as RESTPutAPIGuildIncidentActionsResult | null;
  }

  /**
   * Edits a guild using Discord's official guild-edit body.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord guild-edit body.
   * @returns The edited guild, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild
   */
  public async edit(
    guildId: string,
    data: RESTPatchAPIGuildJSONBody,
  ): Promise<GuildStructureInstance | null> {
    const guild = (await this.client.rest.patch(Routes.guild(guildId), {
      body: data,
    })) as APIGuild | null;
    if (!guild) {
      return null;
    }

    const structure = new GuildStructure(guild, this.client) as unknown as GuildStructureInstance;
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Deletes a guild owned by the current user.
   *
   * @param guildId - The guild ID.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/guild#delete-guild
   */
  public async delete(guildId: string): Promise<void> {
    await this.client.rest.delete(Routes.guild(guildId));
    this._remove(guildId);
  }

  /**
   * Removes a guild from the cache
   * @param {string} id The guild's id
   */
  public _remove(id: string): void {
    this.client.guilds.cache.delete(id);
  }

  /**
   * Fetches a guild's audit log.
   *
   * @param guildId - The guild ID.
   * @param query - The official Discord audit-log query fields.
   * @returns The official Discord audit-log response, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/audit-log#get-guild-audit-log
   */
  public async fetchAuditLogs(
    guildId: string,
    query: RESTGetAPIAuditLogQuery = {},
  ): Promise<RESTGetAPIAuditLogResult | null> {
    const params = Object.fromEntries(
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return this.client.rest.get(Routes.guildAuditLog(guildId), {
      query: params,
    }) as Promise<RESTGetAPIAuditLogResult | null>;
  }

  /**
   * Fetches and wraps a guild's audit log.
   *
   * @param guildId - The guild ID.
   * @param query - The official Discord audit-log query fields.
   * @returns A typed audit-log wrapper, or null when no data was returned.
   */
  public async fetchAuditLog(
    guildId: string,
    query: RESTGetAPIAuditLogQuery = {},
  ): Promise<AuditLogStructureInstance | null> {
    const data = await this.fetchAuditLogs(guildId, query);
    return data
      ? (new AuditLogStructure(data, this.client) as unknown as AuditLogStructureInstance)
      : null;
  }

  /**
   * Fetches the number of members assigned to each role in a guild.
   * The @everyone role is not included in the response.
   */
  public async fetchRoleMemberCounts(
    guildId: string,
  ): Promise<RESTGetAPIGuildRoleMemberCountsResult | null> {
    return this.client.rest.get(
      Routes.guildRoleMemberCounts(guildId),
    ) as Promise<RESTGetAPIGuildRoleMemberCountsResult | null>;
  }

  /**
   * Searches guild members by username or nickname.
   */
  public async searchMembers(
    guildId: string,
    query: RESTGetAPIGuildMembersSearchQuery,
  ): Promise<RESTGetAPIGuildMembersSearchResult | null> {
    const params: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) {
        continue;
      }
      params[key] = Array.isArray(value) ? value.map(String) : String(value);
    }

    return this.client.rest.get(Routes.guildMembersSearch(guildId), {
      query: params,
    }) as Promise<RESTGetAPIGuildMembersSearchResult | null>;
  }

  /**
   * Searches messages in a guild using Discord's indexed message search endpoint.
   */
  public async searchMessages(
    guildId: string,
    query: RESTGetAPIGuildMessagesSearchQuery = {},
  ): Promise<RESTGetAPIGuildMessagesSearchResult | null> {
    const params: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) {
        continue;
      }
      params[key] = Array.isArray(value) ? value.map(String) : String(value);
    }

    return this.client.rest.get(Routes.guildMessagesSearch(guildId), {
      query: params,
    }) as Promise<RESTGetAPIGuildMessagesSearchResult | null>;
  }

  /**
   * Fetches all channels in a guild.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord guild-channel payloads.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-channels
   */
  public async fetchChannels(guildId: string): Promise<RESTGetAPIGuildChannelsResult> {
    return (await this.client.rest.get(
      Routes.guildChannels(guildId),
    )) as RESTGetAPIGuildChannelsResult;
  }

  /**
   * Creates a channel in a guild.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord guild-channel creation body.
   * @param reason - Optional audit-log reason.
   * @returns The created channel, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#create-guild-channel
   */
  public async createChannel(
    guildId: string,
    data: RESTPostAPIGuildChannelJSONBody,
    reason?: string,
  ): Promise<RESTPostAPIGuildChannelResult | null> {
    return (await this.client.rest.post(Routes.guildChannels(guildId), {
      body: data,
      reason,
    })) as RESTPostAPIGuildChannelResult | null;
  }

  /**
   * Changes the positions and parent categories of guild channels.
   *
   * @param guildId - The guild ID.
   * @param positions - The official Discord channel-position payload.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-channel-positions
   */
  public async setChannelPositions(
    guildId: string,
    positions: RESTPatchAPIGuildChannelPositionsJSONBody,
    reason?: string,
  ): Promise<RESTPatchAPIGuildChannelPositionsResult> {
    return (await this.client.rest.patch(Routes.guildChannels(guildId), {
      body: positions,
      reason,
    })) as RESTPatchAPIGuildChannelPositionsResult;
  }

  /**
   * Fetches the PNG widget image for a guild.
   *
   * @param guildId - The guild ID.
   * @param query - The official widget-image query fields.
   * @returns The widget image bytes.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-widget-image
   */
  public async fetchWidgetImage(
    guildId: string,
    query: RESTGetAPIGuildWidgetImageQuery = {},
  ): Promise<RESTGetAPIGuildWidgetImageResult> {
    const params = Object.fromEntries(
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return (await this.client.rest.get(Routes.guildWidgetImage(guildId), {
      query: params,
      responseType: "arrayBuffer",
    })) as RESTGetAPIGuildWidgetImageResult;
  }

  /**
   * Fetches all invites in a guild.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord extended invite payloads.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-invites
   */
  public async fetchInvites(guildId: string): Promise<RESTGetAPIGuildInvitesResult> {
    return (await this.client.rest.get(
      Routes.guildInvites(guildId),
    )) as RESTGetAPIGuildInvitesResult;
  }

  /**
   * Fetches the voice regions available in a guild.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord voice-region payloads.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-voice-regions
   */
  public async fetchVoiceRegions(guildId: string): Promise<RESTGetAPIGuildVoiceRegionsResult> {
    return (await this.client.rest.get(
      Routes.guildVoiceRegions(guildId),
    )) as RESTGetAPIGuildVoiceRegionsResult;
  }

  /**
   * Fetches a guild's widget settings.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord widget settings.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-widget-settings
   */
  public async fetchWidgetSettings(guildId: string): Promise<RESTGetAPIGuildWidgetSettingsResult> {
    return (await this.client.rest.get(
      Routes.guildWidgetSettings(guildId),
    )) as RESTGetAPIGuildWidgetSettingsResult;
  }

  /**
   * Edits a guild's widget settings.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord widget-settings body.
   * @returns The updated widget settings.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-widget
   */
  public async editWidgetSettings(
    guildId: string,
    data: RESTPatchAPIGuildWidgetSettingsJSONBody,
  ): Promise<RESTGetAPIGuildWidgetSettingsResult> {
    return (await this.client.rest.patch(Routes.guildWidgetSettings(guildId), {
      body: data,
    })) as RESTGetAPIGuildWidgetSettingsResult;
  }

  /**
   * Fetches a guild's public widget.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord widget, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-widget
   */
  public async fetchWidget(guildId: string): Promise<RESTGetAPIGuildWidgetJSONResult | null> {
    return (await this.client.rest.get(
      Routes.guildWidgetJSON(guildId),
    )) as RESTGetAPIGuildWidgetJSONResult | null;
  }

  /**
   * Fetches a guild's vanity URL information.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord vanity URL payload.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-vanity-url
   */
  public async fetchVanityUrl(guildId: string): Promise<RESTGetAPIGuildVanityUrlResult> {
    return (await this.client.rest.get(
      Routes.guildVanityUrl(guildId),
    )) as RESTGetAPIGuildVanityUrlResult;
  }

  /**
   * Fetches the number of members eligible for pruning.
   *
   * @param guildId - The guild ID.
   * @param query - The official Discord prune-count query fields.
   * @returns The official Discord prune-count response.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-prune-count
   */
  public async fetchPruneCount(
    guildId: string,
    query: RESTGetAPIGuildPruneCountQuery = {},
  ): Promise<RESTGetAPIGuildPruneCountResult> {
    const params = Object.fromEntries(
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return (await this.client.rest.get(Routes.guildPrune(guildId), {
      query: params,
    })) as RESTGetAPIGuildPruneCountResult;
  }

  /**
   * Starts a guild prune operation.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord prune body.
   * @returns The prune result.
   * @see https://docs.discord.com/developers/resources/guild#begin-guild-prune
   */
  public async prune(
    guildId: string,
    data: RESTPostAPIGuildPruneJSONBody = {},
  ): Promise<RESTPostAPIGuildPruneResult> {
    return (await this.client.rest.post(Routes.guildPrune(guildId), {
      body: data,
    })) as RESTPostAPIGuildPruneResult;
  }

  /**
   * Fetches the active threads in a guild.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord thread-list response.
   * @see https://docs.discord.com/developers/resources/guild#list-active-guild-threads
   */
  public async fetchActiveThreads(guildId: string): Promise<RESTGetAPIGuildThreadsResult> {
    return (await this.client.rest.get(
      Routes.guildActiveThreads(guildId),
    )) as RESTGetAPIGuildThreadsResult;
  }

  /**
   * Fetches a guild welcome screen.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord welcome-screen payload.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-welcome-screen
   */
  public async fetchWelcomeScreen(guildId: string): Promise<RESTGetAPIGuildWelcomeScreenResult> {
    return (await this.client.rest.get(
      Routes.guildWelcomeScreen(guildId),
    )) as RESTGetAPIGuildWelcomeScreenResult;
  }

  /**
   * Edits a guild welcome screen.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord welcome-screen body.
   * @returns The updated welcome screen.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-welcome-screen
   */
  public async editWelcomeScreen(
    guildId: string,
    data: RESTPatchAPIGuildWelcomeScreenJSONBody,
  ): Promise<RESTGetAPIGuildWelcomeScreenResult> {
    return (await this.client.rest.patch(Routes.guildWelcomeScreen(guildId), {
      body: data,
    })) as RESTGetAPIGuildWelcomeScreenResult;
  }

  /**
   * Fetches guild onboarding settings.
   *
   * @param guildId - The guild ID.
   * @returns The official Discord onboarding payload.
   * @see https://docs.discord.com/developers/resources/guild#get-guild-onboarding
   */
  public async fetchOnboarding(guildId: string): Promise<RESTGetAPIGuildOnboardingResult> {
    return (await this.client.rest.get(
      Routes.guildOnboarding(guildId),
    )) as RESTGetAPIGuildOnboardingResult;
  }

  /**
   * Edits guild onboarding settings.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord onboarding body.
   * @returns The updated onboarding payload.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-onboarding
   */
  public async editOnboarding(
    guildId: string,
    data: RESTPutAPIGuildOnboardingJSONBody,
  ): Promise<RESTPutAPIGuildOnboardingResult> {
    return (await this.client.rest.put(Routes.guildOnboarding(guildId), {
      body: data,
    })) as RESTPutAPIGuildOnboardingResult;
  }

  /**
   * Gets the guilds cache
   * @link https://discord.com/developers/docs/resources/guild#guild-object
   * @returns {Cache<string, GuildStructureInstance>} The guilds cache
   */
  public get cache(): Cache<string, GuildStructureInstance> {
    return this._cache;
  }
}
