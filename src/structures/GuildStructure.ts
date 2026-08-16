import type {
  APIChannel,
  APIGuild,
  RESTGetAPIGuildQuery,
  RESTGetAPIGuildVoiceStateCurrentMemberResult,
  RESTGetAPIGuildVoiceStateUserResult,
  RESTPatchAPIGuildChannelPositionsJSONBody,
  RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody,
  RESTPatchAPIGuildVoiceStateUserJSONBody,
  RESTPostAPIGuildChannelJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import type ApplicationCommandManager from "../managers/ApplicationCommandManager";
import type GuildTemplateManager from "../managers/GuildTemplateManager";
import Cache from "../utils/cache";
import { CDN, ImageFormat, Routes } from "../utils/constants";
import type { AuditLogStructureInstance } from "./AuditLogStructure";
import type { AutoModerationRuleStructureInstance } from "./AutoModerationRuleStructure";
import ChannelStructure, { type ChannelStructureInstance } from "./ChannelStructure";
import type { GuildBanStructureInstance } from "./GuildBanStructure";
import type { GuildEmojiStructureInstance } from "./GuildEmojiStructure";
import type { GuildScheduledEventStructureInstance } from "./GuildScheduledEventStructure";
import type { GuildSoundboardSoundStructureInstance } from "./GuildSoundboardSoundStructure";
import type { GuildStickerStructureInstance } from "./GuildStickerStructure";
import type { IntegrationStructureInstance } from "./IntegrationStructure";
import type { InviteStructureInstance } from "./InviteStructure";
import type { MemberStructureInstance } from "./MemberStructure";
import type { RoleStructureInstance } from "./RoleStructure";
import type { StageInstanceStructureInstance } from "./StageInstanceStructure";

class GuildStructure<T extends APIGuild = APIGuild> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }

  /**
   * The guild's mention (not directly usable but for consistency)
   */
  public get mention(): string {
    return (this as unknown as APIGuild).name;
  }

  /**
   * The guild's icon URL
   * @param options - Icon options
   * @returns The icon URL or null if no icon
   */
  public iconURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string | null {
    const guild = this as unknown as APIGuild;
    if (!guild.icon) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.guildIcon(guild.id, guild.icon, extension as Parameters<typeof CDN.guildIcon>[2])}?size=${size}`;
  }

  /**
   * The guild's banner URL
   * @param options - Banner options
   * @returns The banner URL or null if no banner
   */
  public bannerURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string | null {
    const guild = this as unknown as APIGuild;
    if (!guild.banner) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.guildBanner(guild.id, guild.banner, extension as Parameters<typeof CDN.guildBanner>[2])}?size=${size}`;
  }

  /**
   * The guild's splash URL
   * @param options - Splash options
   * @returns The splash URL or null if no splash
   */
  public splashURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp";
  }): string | null {
    const guild = this as unknown as APIGuild;
    if (!guild.splash) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.guildSplash(guild.id, guild.splash, extension as Parameters<typeof CDN.guildSplash>[2])}?size=${size}`;
  }

  /**
   * The guild's discovery splash URL
   * @param options - Discovery splash options
   * @returns The discovery splash URL or null if no discovery splash
   */
  public discoverySplashURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp";
  }): string | null {
    const guild = this as unknown as APIGuild;
    if (!guild.discovery_splash) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.guildDiscoverySplash(guild.id, guild.discovery_splash, extension as Parameters<typeof CDN.guildDiscoverySplash>[2])}?size=${size}`;
  }

  /**
   * The timestamp the guild was created at
   */
  public get createdTimestamp(): number {
    const guild = this as unknown as APIGuild;
    return Number((BigInt(guild.id) >> 22n) + 1420070400000n);
  }

  /**
   * The date the guild was created at
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * Gets the guild-scoped application-command manager.
   *
   * @returns A manager for this guild's application commands.
   */
  public get commands(): ApplicationCommandManager {
    const guild = this as unknown as APIGuild;
    return this.client.application.commands.forGuild(guild.id);
  }

  /**
   * Gets the guild-scoped guild-template manager.
   *
   * @returns A manager for this guild's templates.
   */
  public get templates(): GuildTemplateManager {
    const guild = this as unknown as APIGuild;
    return this.client.templates.forGuild(guild.id);
  }

  /**
   * Gets the guild's channels scoped manager
   * @returns A manager for this guild's channels
   */
  public get channels(): {
    cache: Cache<string, ChannelStructureInstance>;
    fetch: (
      id: string,
      options?: Parameters<Client["channels"]["fetch"]>[1],
    ) => ReturnType<Client["channels"]["fetch"]>;
    create: (data: RESTPostAPIGuildChannelJSONBody) => Promise<ChannelStructureInstance | null>;
    setPositions: (data: RESTPatchAPIGuildChannelPositionsJSONBody) => Promise<void>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.channels.cache.filter(
      (channel) => (channel as unknown as { guild_id: string }).guild_id === guild.id,
    );

    return {
      cache,
      fetch: (id: string, options?: Parameters<typeof client.channels.fetch>[1]) =>
        client.channels.fetch(id, options),
      create: async (data: RESTPostAPIGuildChannelJSONBody) => {
        const channel = (await client.rest.post(Routes.guildChannels(guild.id), {
          body: data,
        })) as APIChannel | null;
        if (!channel) {
          return null;
        }
        const structure = new ChannelStructure(channel, client);
        client.channels.set(channel.id, structure);
        return structure;
      },
      setPositions: async (data: RESTPatchAPIGuildChannelPositionsJSONBody) => {
        await client.rest.patch(Routes.guildChannels(guild.id), {
          body: data,
        });
      },
    };
  }

  /**
   * Gets the guild's members scoped manager
   * @returns A manager for this guild's members
   */
  public get members(): {
    cache: Cache<string, MemberStructureInstance>;
    fetch: (
      memberId: string,
      options?: Parameters<Client["members"]["fetch"]>[2],
    ) => ReturnType<Client["members"]["fetch"]>;
    fetchMany: (
      options?: Parameters<Client["members"]["fetchMany"]>[1],
    ) => ReturnType<Client["members"]["fetchMany"]>;
    search: (
      options: Parameters<Client["members"]["search"]>[1],
    ) => ReturnType<Client["members"]["search"]>;
    add: (
      userId: Parameters<Client["members"]["add"]>[1],
      data: Parameters<Client["members"]["add"]>[2],
      reason?: string,
    ) => ReturnType<Client["members"]["add"]>;
    edit: (
      memberId: string,
      data: Parameters<Client["members"]["edit"]>[2],
      reason?: string,
    ) => ReturnType<Client["members"]["edit"]>;
    kick: (memberId: string, reason?: string) => ReturnType<Client["members"]["kick"]>;
    ban: (
      userId: string,
      options?: Parameters<Client["members"]["ban"]>[2],
    ) => ReturnType<Client["members"]["ban"]>;
    bulkBan: (
      userIds: Parameters<Client["members"]["bulkBan"]>[1],
      options?: Parameters<Client["members"]["bulkBan"]>[2],
    ) => ReturnType<Client["members"]["bulkBan"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const guildMembersCache = client.members.get(guild.id);
    const cache = guildMembersCache ?? new Cache<string, MemberStructureInstance>();

    return {
      cache,
      fetch: (memberId: string, options?: Parameters<typeof client.members.fetch>[2]) =>
        client.members.fetch(guild.id, memberId, options),
      fetchMany: (options?: Parameters<typeof client.members.fetchMany>[1]) =>
        client.members.fetchMany(guild.id, options),
      search: (options: Parameters<typeof client.members.search>[1]) =>
        client.members.search(guild.id, options),
      add: (
        userId: Parameters<typeof client.members.add>[1],
        data: Parameters<typeof client.members.add>[2],
        reason?: string,
      ) => client.members.add(guild.id, userId, data, reason),
      edit: (memberId: string, data: Parameters<typeof client.members.edit>[2], reason?: string) =>
        client.members.edit(guild.id, memberId, data, reason),
      kick: (memberId: string, reason?: string) => client.members.kick(guild.id, memberId, reason),
      ban: (userId: string, options?: Parameters<typeof client.members.ban>[2]) =>
        client.members.ban(guild.id, userId, options),
      bulkBan: (
        userIds: Parameters<typeof client.members.bulkBan>[1],
        options?: Parameters<typeof client.members.bulkBan>[2],
      ) => client.members.bulkBan(guild.id, userIds, options),
    };
  }

  /**
   * Gets the guild's roles scoped manager
   * @returns A manager for this guild's roles
   */
  public get roles(): {
    cache: Cache<string, RoleStructureInstance>;
    fetch: (
      roleId: string,
      options?: Parameters<Client["roles"]["fetch"]>[2],
    ) => ReturnType<Client["roles"]["fetch"]>;
    fetchAll: (
      options?: Parameters<Client["roles"]["fetchAll"]>[1],
    ) => ReturnType<Client["roles"]["fetchAll"]>;
    create: (
      data: Parameters<Client["roles"]["create"]>[1],
      reason?: string,
    ) => ReturnType<Client["roles"]["create"]>;
    edit: (
      roleId: string,
      data: Parameters<Client["roles"]["edit"]>[2],
      reason?: string,
    ) => ReturnType<Client["roles"]["edit"]>;
    delete: (roleId: string, reason?: string) => ReturnType<Client["roles"]["delete"]>;
    setPositions: (
      positions: Parameters<Client["roles"]["setPositions"]>[1],
      reason?: string,
    ) => ReturnType<Client["roles"]["setPositions"]>;
    fetchMemberCounts: () => ReturnType<Client["roles"]["fetchMemberCounts"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.roles.cache.filter(
      (role) => (role as unknown as { guild_id: string }).guild_id === guild.id,
    );

    return {
      cache,
      fetch: (roleId: string, options?: Parameters<typeof client.roles.fetch>[2]) =>
        client.roles.fetch(guild.id, roleId, options),
      fetchAll: (options?: Parameters<typeof client.roles.fetchAll>[1]) =>
        client.roles.fetchAll(guild.id, options),
      create: (data: Parameters<typeof client.roles.create>[1], reason?: string) =>
        client.roles.create(guild.id, data, reason),
      edit: (roleId: string, data: Parameters<typeof client.roles.edit>[2], reason?: string) =>
        client.roles.edit(guild.id, roleId, data, reason),
      delete: (roleId: string, reason?: string) => client.roles.delete(guild.id, roleId, reason),
      setPositions: (positions: Parameters<typeof client.roles.setPositions>[1], reason?: string) =>
        client.roles.setPositions(guild.id, positions, reason),
      fetchMemberCounts: () => client.roles.fetchMemberCounts(guild.id),
    };
  }

  /**
   * Gets the guild's emojis scoped manager
   * @returns A manager for this guild's emojis
   */
  public get emojis(): {
    cache: Cache<string, GuildEmojiStructureInstance>;
    fetch: (
      options?: Parameters<Client["emojis"]["fetch"]>[1],
    ) => ReturnType<Client["emojis"]["fetch"]>;
    fetchOne: (
      emojiId: string,
      options?: Parameters<Client["emojis"]["fetchOne"]>[2],
    ) => ReturnType<Client["emojis"]["fetchOne"]>;
    create: (
      data: Parameters<Client["emojis"]["create"]>[1],
      reason?: string,
    ) => ReturnType<Client["emojis"]["create"]>;
    edit: (
      emojiId: string,
      data: Parameters<Client["emojis"]["edit"]>[2],
      reason?: string,
    ) => ReturnType<Client["emojis"]["edit"]>;
    delete: (emojiId: string, reason?: string) => ReturnType<Client["emojis"]["delete"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.emojis.cache.filter((emoji) => emoji.guildId === guild.id);

    return {
      cache,
      fetch: (options?: Parameters<typeof client.emojis.fetch>[1]) =>
        client.emojis.fetch(guild.id, options),
      fetchOne: (emojiId: string, options?: Parameters<typeof client.emojis.fetchOne>[2]) =>
        client.emojis.fetchOne(guild.id, emojiId, options),
      create: (data: Parameters<typeof client.emojis.create>[1], reason?: string) =>
        client.emojis.create(guild.id, data, reason),
      edit: (emojiId: string, data: Parameters<typeof client.emojis.edit>[2], reason?: string) =>
        client.emojis.edit(guild.id, emojiId, data, reason),
      delete: (emojiId: string, reason?: string) => client.emojis.delete(guild.id, emojiId, reason),
    };
  }

  /**
   * Gets the guild's stickers scoped manager
   * @returns A manager for this guild's stickers
   */
  public get stickers(): {
    cache: Cache<string, GuildStickerStructureInstance>;
    fetch: (
      options?: Parameters<Client["stickers"]["fetch"]>[1],
    ) => ReturnType<Client["stickers"]["fetch"]>;
    fetchOne: (
      stickerId: string,
      options?: Parameters<Client["stickers"]["fetchOne"]>[2],
    ) => ReturnType<Client["stickers"]["fetchOne"]>;
    create: (
      data: Parameters<Client["stickers"]["create"]>[1],
      reason?: string,
    ) => ReturnType<Client["stickers"]["create"]>;
    edit: (
      stickerId: string,
      data: Parameters<Client["stickers"]["edit"]>[2],
      reason?: string,
    ) => ReturnType<Client["stickers"]["edit"]>;
    delete: (stickerId: string, reason?: string) => ReturnType<Client["stickers"]["delete"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.stickers.cache.filter((sticker) => sticker.guildId === guild.id);

    return {
      cache,
      fetch: (options?: Parameters<typeof client.stickers.fetch>[1]) =>
        client.stickers.fetch(guild.id, options),
      fetchOne: (stickerId: string, options?: Parameters<typeof client.stickers.fetchOne>[2]) =>
        client.stickers.fetchOne(guild.id, stickerId, options),
      create: (data: Parameters<typeof client.stickers.create>[1], reason?: string) =>
        client.stickers.create(guild.id, data, reason),
      edit: (
        stickerId: string,
        data: Parameters<typeof client.stickers.edit>[2],
        reason?: string,
      ) => client.stickers.edit(guild.id, stickerId, data, reason),
      delete: (stickerId: string, reason?: string) =>
        client.stickers.delete(guild.id, stickerId, reason),
    };
  }

  /**
   * Gets the guild's bans scoped manager
   * @returns A manager for this guild's bans
   */
  public get bans(): {
    cache: Cache<string, GuildBanStructureInstance>;
    fetch: (
      options?: Parameters<Client["bans"]["fetch"]>[1],
    ) => ReturnType<Client["bans"]["fetch"]>;
    fetchOne: (
      userId: string,
      options?: Parameters<Client["bans"]["fetchOne"]>[2],
    ) => ReturnType<Client["bans"]["fetchOne"]>;
    create: (
      userId: string,
      options?: Parameters<Client["bans"]["create"]>[2],
    ) => ReturnType<Client["bans"]["create"]>;
    bulkCreate: (
      userIds: Parameters<Client["bans"]["bulkCreate"]>[1],
      options?: Parameters<Client["bans"]["bulkCreate"]>[2],
    ) => ReturnType<Client["bans"]["bulkCreate"]>;
    remove: (userId: string, reason?: string) => ReturnType<Client["bans"]["remove"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.bans.cache.filter((ban) => ban.guildId === guild.id);

    return {
      cache,
      fetch: (options?: Parameters<typeof client.bans.fetch>[1]) =>
        client.bans.fetch(guild.id, options),
      fetchOne: (userId: string, options?: Parameters<typeof client.bans.fetchOne>[2]) =>
        client.bans.fetchOne(guild.id, userId, options),
      create: (userId: string, options?: Parameters<typeof client.bans.create>[2]) =>
        client.bans.create(guild.id, userId, options),
      bulkCreate: (
        userIds: Parameters<typeof client.bans.bulkCreate>[1],
        options?: Parameters<typeof client.bans.bulkCreate>[2],
      ) => client.bans.bulkCreate(guild.id, userIds, options),
      remove: (userId: string, reason?: string) => client.bans.remove(guild.id, userId, reason),
    };
  }

  /**
   * Fetches this guild's audit log.
   *
   * @param query - The official Discord audit-log query fields.
   * @returns The official Discord audit-log response, or null when no data was returned.
   * @see https://docs.discord.com/developers/resources/audit-log#get-guild-audit-log
   */
  public fetchAuditLogs(
    query?: Parameters<Client["guilds"]["fetchAuditLogs"]>[1],
  ): ReturnType<Client["guilds"]["fetchAuditLogs"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchAuditLogs(guild.id, query);
  }

  /**
   * Fetches this guild's audit log as a typed wrapper with indexed entries.
   *
   * @param query - The official Discord audit-log query fields.
   * @returns The wrapped audit log, or null when Discord returned no data.
   */
  public fetchAuditLog(
    query?: Parameters<Client["guilds"]["fetchAuditLog"]>[1],
  ): Promise<AuditLogStructureInstance | null> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchAuditLog(guild.id, query);
  }

  /**
   * Gets the guild's invites scoped manager
   * @returns A manager for this guild's invites
   */
  public get invites(): {
    cache: Cache<string, InviteStructureInstance>;
    fetch: (
      code: string,
      options?: Parameters<Client["invites"]["fetch"]>[1],
    ) => ReturnType<Client["invites"]["fetch"]>;
    delete: (code: string, reason?: string) => ReturnType<Client["invites"]["delete"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.invites.cache.filter((invite) => invite.guildId === guild.id);

    return {
      cache,
      fetch: (code: string, options?: Parameters<typeof client.invites.fetch>[1]) =>
        client.invites.fetch(code, options),
      delete: (code: string, reason?: string) => client.invites.delete(code, reason),
    };
  }

  /**
   * Gets the guild's scheduled events scoped manager.
   * @returns A manager for this guild's scheduled events.
   */
  public get scheduledEvents(): {
    cache: Cache<string, GuildScheduledEventStructureInstance>;
    fetch: (
      options?: Parameters<Client["scheduledEvents"]["fetch"]>[1],
    ) => ReturnType<Client["scheduledEvents"]["fetch"]>;
    fetchOne: (
      eventId: string,
      withUserCount?: boolean,
    ) => ReturnType<Client["scheduledEvents"]["fetchOne"]>;
    create: (
      data: Parameters<Client["scheduledEvents"]["create"]>[1],
      reason?: string,
    ) => ReturnType<Client["scheduledEvents"]["create"]>;
    edit: (
      eventId: string,
      data: Parameters<Client["scheduledEvents"]["edit"]>[2],
      reason?: string,
    ) => ReturnType<Client["scheduledEvents"]["edit"]>;
    delete: (eventId: string, reason?: string) => ReturnType<Client["scheduledEvents"]["delete"]>;
    fetchSubscribers: (
      eventId: string,
      query?: Parameters<Client["scheduledEvents"]["fetchSubscribers"]>[2],
    ) => ReturnType<Client["scheduledEvents"]["fetchSubscribers"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.scheduledEvents.cache.filter((event) => event.guild_id === guild.id);

    return {
      cache,
      fetch: (options?: Parameters<typeof client.scheduledEvents.fetch>[1]) =>
        client.scheduledEvents.fetch(guild.id, options),
      fetchOne: (eventId: string, withUserCount?: boolean) =>
        client.scheduledEvents.fetchOne(guild.id, eventId, withUserCount),
      create: (data: Parameters<typeof client.scheduledEvents.create>[1], reason?: string) =>
        client.scheduledEvents.create(guild.id, data, reason),
      edit: (
        eventId: string,
        data: Parameters<typeof client.scheduledEvents.edit>[2],
        reason?: string,
      ) => client.scheduledEvents.edit(guild.id, eventId, data, reason),
      delete: (eventId: string, reason?: string) =>
        client.scheduledEvents.delete(guild.id, eventId, reason),
      fetchSubscribers: (
        eventId: string,
        query?: Parameters<typeof client.scheduledEvents.fetchSubscribers>[2],
      ) => client.scheduledEvents.fetchSubscribers(guild.id, eventId, query),
    };
  }

  /**
   * Gets the guild's auto-moderation rules scoped manager.
   * @returns A manager for this guild's auto-moderation rules.
   */
  public get autoModerationRules(): {
    cache: Cache<string, AutoModerationRuleStructureInstance>;
    fetch: (
      options?: Parameters<Client["autoModerationRules"]["fetch"]>[1],
    ) => ReturnType<Client["autoModerationRules"]["fetch"]>;
    fetchOne: (ruleId: string) => ReturnType<Client["autoModerationRules"]["fetchOne"]>;
    create: (
      data: Parameters<Client["autoModerationRules"]["create"]>[1],
      reason?: string,
    ) => ReturnType<Client["autoModerationRules"]["create"]>;
    edit: (
      ruleId: string,
      data: Parameters<Client["autoModerationRules"]["edit"]>[2],
      reason?: string,
    ) => ReturnType<Client["autoModerationRules"]["edit"]>;
    delete: (
      ruleId: string,
      reason?: string,
    ) => ReturnType<Client["autoModerationRules"]["delete"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.autoModerationRules.cache.filter((rule) => rule.guildId === guild.id);

    return {
      cache,
      fetch: (options?: Parameters<typeof client.autoModerationRules.fetch>[1]) =>
        client.autoModerationRules.fetch(guild.id, options),
      fetchOne: (ruleId: string) => client.autoModerationRules.fetchOne(guild.id, ruleId),
      create: (data: Parameters<typeof client.autoModerationRules.create>[1], reason?: string) =>
        client.autoModerationRules.create(guild.id, data, reason),
      edit: (
        ruleId: string,
        data: Parameters<typeof client.autoModerationRules.edit>[2],
        reason?: string,
      ) => client.autoModerationRules.edit(guild.id, ruleId, data, reason),
      delete: (ruleId: string, reason?: string) =>
        client.autoModerationRules.delete(guild.id, ruleId, reason),
    };
  }

  /**
   * Gets the guild's stage-instance manager.
   * @returns A manager for stage instances.
   */
  public get stageInstances(): {
    cache: Cache<string, StageInstanceStructureInstance>;
    fetch: (
      channelId: string,
      options?: Parameters<Client["stageInstances"]["fetch"]>[1],
    ) => ReturnType<Client["stageInstances"]["fetch"]>;
    create: (
      data: Parameters<Client["stageInstances"]["create"]>[0],
    ) => ReturnType<Client["stageInstances"]["create"]>;
    edit: (
      channelId: string,
      data: Parameters<Client["stageInstances"]["edit"]>[1],
    ) => ReturnType<Client["stageInstances"]["edit"]>;
    delete: (channelId: string) => ReturnType<Client["stageInstances"]["delete"]>;
  } {
    const client = this.client;
    return {
      cache: client.stageInstances.cache,
      fetch: (channelId: string, options?: Parameters<typeof client.stageInstances.fetch>[1]) =>
        client.stageInstances.fetch(channelId, options),
      create: (data: Parameters<typeof client.stageInstances.create>[0]) =>
        client.stageInstances.create(data),
      edit: (channelId: string, data: Parameters<typeof client.stageInstances.edit>[1]) =>
        client.stageInstances.edit(channelId, data),
      delete: (channelId: string) => client.stageInstances.delete(channelId),
    };
  }

  /**
   * Gets the guild's soundboard-sound manager.
   * @returns A manager for this guild's soundboard sounds.
   */
  public get soundboardSounds(): {
    cache: Cache<string, GuildSoundboardSoundStructureInstance>;
    fetch: (
      options?: Parameters<Client["soundboardSounds"]["fetch"]>[1],
    ) => ReturnType<Client["soundboardSounds"]["fetch"]>;
    create: (
      data: Parameters<Client["soundboardSounds"]["create"]>[1],
      reason?: string,
    ) => ReturnType<Client["soundboardSounds"]["create"]>;
    edit: (
      soundId: string,
      data: Parameters<Client["soundboardSounds"]["edit"]>[2],
      reason?: string,
    ) => ReturnType<Client["soundboardSounds"]["edit"]>;
    delete: (soundId: string, reason?: string) => ReturnType<Client["soundboardSounds"]["delete"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.soundboardSounds.cache.filter((sound) => sound.guildId === guild.id);

    return {
      cache,
      fetch: (options?: Parameters<typeof client.soundboardSounds.fetch>[1]) =>
        client.soundboardSounds.fetch(guild.id, options),
      create: (data: Parameters<typeof client.soundboardSounds.create>[1], reason?: string) =>
        client.soundboardSounds.create(guild.id, data, reason),
      edit: (
        soundId: string,
        data: Parameters<typeof client.soundboardSounds.edit>[2],
        reason?: string,
      ) => client.soundboardSounds.edit(guild.id, soundId, data, reason),
      delete: (soundId: string, reason?: string) =>
        client.soundboardSounds.delete(guild.id, soundId, reason),
    };
  }

  /**
   * Gets the guild's integrations scoped manager
   * @returns A manager for this guild's integrations
   */
  public get integrations(): {
    cache: Cache<string, IntegrationStructureInstance>;
    fetch: (
      options?: Parameters<Client["integrations"]["fetch"]>[1],
    ) => ReturnType<Client["integrations"]["fetch"]>;
    delete: (integrationId: string) => ReturnType<Client["integrations"]["delete"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.integrations.cache.filter(
      (integration) => integration.guildId === guild.id,
    );

    return {
      cache,
      fetch: (options?: Parameters<typeof client.integrations.fetch>[1]) =>
        client.integrations.fetch(guild.id, options),
      delete: (integrationId: string) => client.integrations.delete(guild.id, integrationId),
    };
  }

  /**
   * Fetches all channels in this guild.
   *
   * @returns The official Discord guild-channel payloads.
   */
  public fetchChannels(): ReturnType<Client["guilds"]["fetchChannels"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchChannels(guild.id);
  }

  /**
   * Fetches all invites in this guild.
   *
   * @returns The official Discord extended invite payloads.
   */
  public fetchInvites(): ReturnType<Client["guilds"]["fetchInvites"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchInvites(guild.id);
  }

  /**
   * Fetches voice regions available in this guild.
   *
   * @returns The official Discord voice-region payloads.
   */
  public fetchVoiceRegions(): ReturnType<Client["guilds"]["fetchVoiceRegions"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchVoiceRegions(guild.id);
  }

  /**
   * Fetches this guild's widget settings.
   *
   * @returns The official Discord widget settings.
   */
  public fetchWidgetSettings(): ReturnType<Client["guilds"]["fetchWidgetSettings"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchWidgetSettings(guild.id);
  }

  /**
   * Edits this guild's widget settings.
   *
   * @param data - The official Discord widget-settings body.
   * @returns The updated widget settings.
   */
  public editWidgetSettings(
    data: Parameters<Client["guilds"]["editWidgetSettings"]>[1],
  ): ReturnType<Client["guilds"]["editWidgetSettings"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.editWidgetSettings(guild.id, data);
  }

  /**
   * Fetches this guild's public widget.
   *
   * @returns The official Discord widget, or null when no data was returned.
   */
  public fetchWidget(): ReturnType<Client["guilds"]["fetchWidget"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchWidget(guild.id);
  }

  /**
   * Fetches this guild's vanity URL information.
   *
   * @returns The official Discord vanity URL payload.
   */
  public fetchVanityUrl(): ReturnType<Client["guilds"]["fetchVanityUrl"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchVanityUrl(guild.id);
  }

  /**
   * Fetches the number of members eligible for pruning.
   *
   * @param query - The official Discord prune-count query fields.
   * @returns The official Discord prune-count response.
   */
  public fetchPruneCount(
    query?: Parameters<Client["guilds"]["fetchPruneCount"]>[1],
  ): ReturnType<Client["guilds"]["fetchPruneCount"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchPruneCount(guild.id, query);
  }

  /**
   * Starts a guild prune operation.
   *
   * @param data - The official Discord prune body.
   * @returns The prune result.
   */
  public prune(
    data?: Parameters<Client["guilds"]["prune"]>[1],
  ): ReturnType<Client["guilds"]["prune"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.prune(guild.id, data);
  }

  /**
   * Fetches the active threads in this guild.
   *
   * @returns The official Discord thread-list response.
   */
  public fetchActiveThreads(): ReturnType<Client["guilds"]["fetchActiveThreads"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchActiveThreads(guild.id);
  }

  /**
   * Fetches this guild's welcome screen.
   *
   * @returns The official Discord welcome-screen payload.
   */
  public fetchWelcomeScreen(): ReturnType<Client["guilds"]["fetchWelcomeScreen"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchWelcomeScreen(guild.id);
  }

  /**
   * Edits this guild's welcome screen.
   *
   * @param data - The official Discord welcome-screen body.
   * @returns The updated welcome screen.
   */
  public editWelcomeScreen(
    data: Parameters<Client["guilds"]["editWelcomeScreen"]>[1],
  ): ReturnType<Client["guilds"]["editWelcomeScreen"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.editWelcomeScreen(guild.id, data);
  }

  /**
   * Fetches this guild's onboarding settings.
   *
   * @returns The official Discord onboarding payload.
   */
  public fetchOnboarding(): ReturnType<Client["guilds"]["fetchOnboarding"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchOnboarding(guild.id);
  }

  /**
   * Edits this guild's onboarding settings.
   *
   * @param data - The official Discord onboarding body.
   * @returns The updated onboarding payload.
   */
  public editOnboarding(
    data: Parameters<Client["guilds"]["editOnboarding"]>[1],
  ): ReturnType<Client["guilds"]["editOnboarding"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.editOnboarding(guild.id, data);
  }

  /**
   * Fetches the latest guild data from Discord.
   * @param options - Official Discord guild query fields.
   * @returns The refreshed guild structure, or null if Discord returned no data.
   */
  public async fetch(options?: RESTGetAPIGuildQuery): Promise<GuildStructureInstance | null> {
    const guild = this as unknown as APIGuild;
    const query = options
      ? Object.fromEntries(Object.entries(options).map(([key, value]) => [key, String(value)]))
      : undefined;
    const data = (await this.client.rest.get(Routes.guild(guild.id), { query })) as APIGuild | null;
    return data
      ? (new GuildStructure(data, this.client) as unknown as GuildStructureInstance)
      : null;
  }

  /**
   * Fetches this guild's public preview.
   *
   * @returns The official guild-preview payload, or null when Discord returned no data.
   */
  public fetchPreview(): ReturnType<Client["guilds"]["fetchPreview"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchPreview(guild.id);
  }

  /**
   * Fetches this guild's membership-screening settings.
   *
   * @returns The official membership-screening payload.
   */
  public fetchMemberVerification(): ReturnType<Client["guilds"]["fetchMemberVerification"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.fetchMemberVerification(guild.id);
  }

  /**
   * Edits this guild's membership-screening settings.
   *
   * @param data - The official membership-screening body.
   * @returns The updated membership-screening payload.
   */
  public editMemberVerification(
    data: Parameters<Client["guilds"]["editMemberVerification"]>[1],
  ): ReturnType<Client["guilds"]["editMemberVerification"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.editMemberVerification(guild.id, data);
  }

  /**
   * Updates temporary incident restrictions for this guild.
   *
   * @param data - The official incident-actions body.
   * @returns The updated incident state.
   */
  public editIncidentActions(
    data: Parameters<Client["guilds"]["editIncidentActions"]>[1],
  ): ReturnType<Client["guilds"]["editIncidentActions"]> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.editIncidentActions(guild.id, data);
  }

  /**
   * Fetches a voice state in this guild.
   *
   * @param userId - The user ID, or omitted for the current user.
   * @returns The official voice-state payload, or null when Discord returned no data.
   */
  public async fetchVoiceState(
    userId?: string,
  ): Promise<
    RESTGetAPIGuildVoiceStateCurrentMemberResult | RESTGetAPIGuildVoiceStateUserResult | null
  > {
    const guild = this as unknown as APIGuild;
    return (await this.client.rest.get(Routes.guildVoiceState(guild.id, userId))) as
      | RESTGetAPIGuildVoiceStateCurrentMemberResult
      | RESTGetAPIGuildVoiceStateUserResult
      | null;
  }

  /**
   * Updates a voice state in this guild.
   *
   * @param data - The official voice-state body.
   * @param userId - The user ID, or omitted for the current user.
   * @returns A promise that resolves when Discord accepts the request.
   */
  public async editVoiceState(
    data:
      | RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody
      | RESTPatchAPIGuildVoiceStateUserJSONBody,
    userId?: string,
  ): Promise<void> {
    const guild = this as unknown as APIGuild;
    await this.client.rest.patch(Routes.guildVoiceState(guild.id, userId), { body: data });
  }

  /**
   * Edits this guild using Discord's official guild-edit body.
   *
   * @param data - The official Discord guild-edit body.
   * @returns The edited guild, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild
   */
  public edit(
    data: Parameters<Client["guilds"]["edit"]>[1],
  ): Promise<GuildStructureInstance | null> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.edit(guild.id, data);
  }

  /**
   * Changes this guild's name.
   *
   * @param name - The new guild name.
   * @returns The edited guild, or null when Discord returned no data.
   */
  public setName(name: string): Promise<GuildStructureInstance | null> {
    return this.edit({ name });
  }

  /**
   * Changes or clears this guild's icon.
   *
   * @param icon - A base64 data URI, or null to clear the icon.
   * @returns The edited guild, or null when Discord returned no data.
   */
  public setIcon(icon: string | null): Promise<GuildStructureInstance | null> {
    return this.edit({ icon });
  }

  /**
   * Deletes this guild when the current user owns it.
   *
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/guild#delete-guild
   */
  public delete(): Promise<void> {
    const guild = this as unknown as APIGuild;
    return this.client.guilds.delete(guild.id);
  }

  /**
   * Leaves this guild as the current bot user.
   * @returns A promise that resolves when Discord accepts the leave request.
   */
  public async leave(): Promise<void> {
    const guild = this as unknown as APIGuild;
    await this.client.rest.delete(Routes.userGuild(guild.id));
  }

  /**
   * Checks if this guild equals another guild
   * @param guild - The guild to compare with
   * @returns Whether the guilds are equal
   */
  public equals(guild: GuildStructureInstance): boolean {
    const guildA = this as unknown as APIGuild;
    const guildB = guild as unknown as APIGuild;
    return guildA.id === guildB.id;
  }

  /**
   * Checks if the current user is the owner of the guild
   * @returns Whether the current user is the owner
   */
  public get isOwner(): boolean {
    const guild = this as unknown as APIGuild;
    return guild.owner_id === this.client.me?.id;
  }

  /**
   * Checks if the guild is available
   * @returns Whether the guild is available
   */
  public get available(): boolean {
    const guild = this as unknown as APIGuild & { unavailable?: boolean };
    return guild.unavailable !== true;
  }

  /**
   * Checks if the guild is large
   * @returns Whether the guild is large
   */
  public get isLarge(): boolean {
    const guild = this as unknown as APIGuild;
    return (guild.approximate_member_count ?? 0) > 250;
  }
}

export default GuildStructure as new <T extends APIGuild = APIGuild>(
  data: T,
  client: Client,
) => GuildStructure<T> &
  Omit<T, "roles" | "emojis" | "stickers" | "channels"> & { readonly client: Client };

export type GuildStructureInstance = InstanceType<typeof GuildStructure> &
  Omit<APIGuild, "roles" | "emojis" | "stickers" | "channels"> & { readonly client: Client };
