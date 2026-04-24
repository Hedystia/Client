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
   * @returns An object with cache and fetch for this guild's channels
   */
  public get channels() {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    return {
      get cache() {
        const filtered = new Cache<string, ChannelStructureInstance>();
        for (const [key, channel] of client.channels.cache.entries()) {
          if ((channel as unknown as { guild_id: string }).guild_id === guild.id) {
            filtered.set(key, channel);
          }
        }
        return filtered;
      },
      fetch(id: string, options?: Parameters<typeof client.channels.fetch>[1]) {
        return client.channels.fetch(id, options);
      },
    };
  }

  /**
   * Gets the guild's members scoped manager
   * @returns An object with cache and fetch for this guild's members
   */
  public get members() {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    return {
      get cache() {
        const filtered = new Cache<string, MemberStructureInstance>();
        for (const [key, member] of client.members.cache.entries()) {
          if (member.guildId === guild.id) {
            filtered.set(key, member);
          }
        }
        return filtered;
      },
      fetch(memberId: string, options?: Parameters<typeof client.members.fetch>[2]) {
        return client.members.fetch(guild.id, memberId, options);
      },
    };
  }

  /**
   * Gets the guild's roles scoped manager
   * @returns An object with cache and fetch for this guild's roles
   */
  public get roles() {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    return {
      get cache() {
        const filtered = new Cache<string, RoleStructureInstance>();
        for (const [key, role] of client.roles.cache.entries()) {
          if ((role as unknown as { guild_id: string }).guild_id === guild.id) {
            filtered.set(key, role);
          }
        }
        return filtered;
      },
      fetch(roleId: string, options?: Parameters<typeof client.roles.fetch>[2]) {
        return client.roles.fetch(guild.id, roleId, options);
      },
    };
  }

  /**
   * Gets the guild's emojis scoped manager
   * @returns An object with cache, fetch and fetchOne for this guild's emojis
   */
  public get emojis() {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    return {
      get cache() {
        const filtered = new Cache<string, GuildEmojiStructureInstance>();
        for (const [key, emoji] of client.emojis.cache.entries()) {
          if (emoji.guildId === guild.id) {
            filtered.set(key, emoji);
          }
        }
        return filtered;
      },
      fetch(options?: Parameters<typeof client.emojis.fetch>[1]) {
        return client.emojis.fetch(guild.id, options);
      },
      fetchOne(emojiId: string, options?: Parameters<typeof client.emojis.fetchOne>[2]) {
        return client.emojis.fetchOne(guild.id, emojiId, options);
      },
    };
  }

  /**
   * Gets the guild's stickers scoped manager
   * @returns An object with cache, fetch and fetchOne for this guild's stickers
   */
  public get stickers() {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    return {
      get cache() {
        const filtered = new Cache<string, GuildStickerStructureInstance>();
        for (const [key, sticker] of client.stickers.cache.entries()) {
          if (sticker.guildId === guild.id) {
            filtered.set(key, sticker);
          }
        }
        return filtered;
      },
      fetch(options?: Parameters<typeof client.stickers.fetch>[1]) {
        return client.stickers.fetch(guild.id, options);
      },
      fetchOne(stickerId: string, options?: Parameters<typeof client.stickers.fetchOne>[2]) {
        return client.stickers.fetchOne(guild.id, stickerId, options);
      },
    };
  }

  /**
   * Gets the guild's bans scoped manager
   * @returns An object with cache, fetch, fetchOne, create and remove for this guild's bans
   */
  public get bans() {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    return {
      get cache() {
        const filtered = new Cache<string, GuildBanStructureInstance>();
        for (const [key, ban] of client.bans.cache.entries()) {
          if (ban.guildId === guild.id) {
            filtered.set(key, ban);
          }
        }
        return filtered;
      },
      fetch(options?: Parameters<typeof client.bans.fetch>[1]) {
        return client.bans.fetch(guild.id, options);
      },
      fetchOne(userId: string, options?: Parameters<typeof client.bans.fetchOne>[2]) {
        return client.bans.fetchOne(guild.id, userId, options);
      },
      create(userId: string, options?: Parameters<typeof client.bans.create>[2]) {
        return client.bans.create(guild.id, userId, options);
      },
      remove(userId: string, reason?: string) {
        return client.bans.remove(guild.id, userId, reason);
      },
    };
  }

  /**
   * Gets the guild's invites scoped manager
   * @returns An object with cache, fetch and delete for this guild's invites
   */
  public get invites() {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    return {
      get cache() {
        const filtered = new Cache<string, InviteStructureInstance>();
        for (const [key, invite] of client.invites.cache.entries()) {
          if (invite.guildId === guild.id) {
            filtered.set(key, invite);
          }
        }
        return filtered;
      },
      fetch(code: string, options?: Parameters<typeof client.invites.fetch>[1]) {
        return client.invites.fetch(code, options);
      },
      delete(code: string, reason?: string) {
        return client.invites.delete(code, reason);
      },
    };
  }

  /**
   * Gets the guild's scheduled events scoped manager
   * @returns An object with cache and fetch for this guild's scheduled events
   */
  public get scheduledEvents() {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    return {
      get cache() {
        const filtered = new Cache<string, GuildScheduledEventStructureInstance>();
        for (const [key, event] of client.scheduledEvents.cache.entries()) {
          if (event.guildId === guild.id) {
            filtered.set(key, event);
          }
        }
        return filtered;
      },
      fetch(options?: Parameters<typeof client.scheduledEvents.fetch>[1]) {
        return client.scheduledEvents.fetch(guild.id, options);
      },
    };
  }

  /**
   * Gets the guild's integrations scoped manager
   * @returns An object with cache, fetch and delete for this guild's integrations
   */
  public get integrations() {
    const guild = this as unknown as APIGuild;
    const client = this.client;
    return {
      get cache() {
        const filtered = new Cache<string, IntegrationStructureInstance>();
        for (const [key, integration] of client.integrations.cache.entries()) {
          if (integration.guildId === guild.id) {
            filtered.set(key, integration);
          }
        }
        return filtered;
      },
      fetch(options?: Parameters<typeof client.integrations.fetch>[1]) {
        return client.integrations.fetch(guild.id, options);
      },
      delete(integrationId: string) {
        return client.integrations.delete(guild.id, integrationId);
      },
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
