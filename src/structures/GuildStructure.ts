import type { APIGuild } from "discord-api-types/v10";
import type Client from "../client";
import Cache from "../utils/cache";
import type { ChannelStructureInstance } from "./ChannelStructure";
import type { GuildBanStructureInstance } from "./GuildBanStructure";
import type { GuildEmojiStructureInstance } from "./GuildEmojiStructure";
import type { GuildScheduledEventStructureInstance } from "./GuildScheduledEventStructure";
import type { GuildStickerStructureInstance } from "./GuildStickerStructure";
import type { IntegrationStructureInstance } from "./IntegrationStructure";
import type { InviteStructureInstance } from "./InviteStructure";
import type { MemberStructureInstance } from "./MemberStructure";
import type { RoleStructureInstance } from "./RoleStructure";

class GuildStructure<T extends APIGuild = APIGuild> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
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
    const extension = options?.extension ?? "png";
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${extension}?size=${size}`;
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
    const extension = options?.extension ?? "png";
    return `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.${extension}?size=${size}`;
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
    const extension = options?.extension ?? "png";
    return `https://cdn.discordapp.com/splashes/${guild.id}/${guild.splash}.${extension}?size=${size}`;
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
    const extension = options?.extension ?? "png";
    return `https://cdn.discordapp.com/discovery-splashes/${guild.id}/${guild.discovery_splash}.${extension}?size=${size}`;
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
   * Gets the guild's channels scoped manager
   * @returns A manager for this guild's channels
   */
  public get channels(): {
    cache: Cache<string, ChannelStructureInstance>;
    fetch: (
      id: string,
      options?: Parameters<Client["channels"]["fetch"]>[1],
    ) => ReturnType<Client["channels"]["fetch"]>;
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
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.members.cache.filter((member) => member.guildId === guild.id);

    return {
      cache,
      fetch: (memberId: string, options?: Parameters<typeof client.members.fetch>[2]) =>
        client.members.fetch(guild.id, memberId, options),
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
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.stickers.cache.filter((sticker) => sticker.guildId === guild.id);

    return {
      cache,
      fetch: (options?: Parameters<typeof client.stickers.fetch>[1]) =>
        client.stickers.fetch(guild.id, options),
      fetchOne: (
        stickerId: string,
        options?: Parameters<typeof client.stickers.fetchOne>[2],
      ) => client.stickers.fetchOne(guild.id, stickerId, options),
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
    remove: (
      userId: string,
      reason?: string,
    ) => ReturnType<Client["bans"]["remove"]>;
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
      remove: (userId: string, reason?: string) =>
        client.bans.remove(guild.id, userId, reason),
    };
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
    delete: (
      code: string,
      reason?: string,
    ) => ReturnType<Client["invites"]["delete"]>;
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
   * Gets the guild's scheduled events scoped manager
   * @returns A manager for this guild's scheduled events
   */
  public get scheduledEvents(): {
    cache: Cache<string, GuildScheduledEventStructureInstance>;
    fetch: (
      options?: Parameters<Client["scheduledEvents"]["fetch"]>[1],
    ) => ReturnType<Client["scheduledEvents"]["fetch"]>;
  } {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    const cache = client.scheduledEvents.cache.filter((event) => event.guildId === guild.id);

    return {
      cache,
      fetch: (options?: Parameters<typeof client.scheduledEvents.fetch>[1]) =>
        client.scheduledEvents.fetch(guild.id, options),
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
    delete: (
      integrationId: string,
    ) => ReturnType<Client["integrations"]["delete"]>;
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
) => GuildStructure<T> & T & { readonly client: Client };

export type GuildStructureInstance = InstanceType<typeof GuildStructure> &
  APIGuild & { readonly client: Client };
