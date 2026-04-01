import type { APIGuild } from "discord-api-types/v10";
import type Client from "../client";
import type { ChannelStructureInstance } from "./ChannelStructure";
import type { MemberStructureInstance } from "./MemberStructure";
import type { RoleStructureInstance } from "./RoleStructure";

class GuildStructure<T extends APIGuild = APIGuild> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
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
   * Gets the members of the guild from cache
   * @returns An array of members
   */
  public get members(): MemberStructureInstance[] {
    const guild = this as unknown as APIGuild;
    const members: MemberStructureInstance[] = [];

    for (const member of this.client.members.cache.values()) {
      if ((member as unknown as { guild_id: string }).guild_id === guild.id) {
        members.push(member);
      }
    }

    return members;
  }

  /**
   * Gets the channels of the guild from cache
   * @returns An array of channels
   */
  public get channels(): ChannelStructureInstance[] {
    const guild = this as unknown as APIGuild;
    const channels: ChannelStructureInstance[] = [];

    for (const channel of this.client.channels.cache.values()) {
      if ((channel as unknown as { guild_id: string }).guild_id === guild.id) {
        channels.push(channel);
      }
    }

    return channels;
  }

  /**
   * Gets the roles of the guild from cache
   * @returns An array of roles
   */
  public get roles(): RoleStructureInstance[] {
    const guild = this as unknown as APIGuild;
    const roles: RoleStructureInstance[] = [];

    for (const role of this.client.roles.cache.values()) {
      if ((role as unknown as { guild_id: string }).guild_id === guild.id) {
        roles.push(role);
      }
    }

    return roles;
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
