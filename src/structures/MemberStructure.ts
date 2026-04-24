import type { APIGuildMember } from "discord-api-types/v10";
import type Client from "../client";

class MemberStructure<T extends APIGuildMember = APIGuildMember> {
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    Object.assign(this, data);
    this.guildId = guildId;
    this.client = client;
  }

  /**
   * The member's mention
   */
  public get mention(): string {
    const member = this as unknown as APIGuildMember;
    return `<@${member.user?.id}>`;
  }

  /**
   * The member's nickname mention
   */
  public get nicknameMention(): string | null {
    const member = this as unknown as APIGuildMember;
    if (member.nick) {
      return `<@!${member.user?.id}>`;
    }
    return null;
  }

  /**
   * The member's display name (nickname or username)
   */
  public get displayName(): string | null {
    const member = this as unknown as APIGuildMember;
    return member.nick ?? member.user?.global_name ?? member.user?.username ?? null;
  }

  /**
   * The member's avatar URL
   * @param options - Avatar options
   * @returns The avatar URL or null if no avatar
   */
  public avatarURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string | null {
    const member = this as unknown as APIGuildMember;
    if (!member.avatar) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension = options?.extension ?? "png";
    return `https://cdn.discordapp.com/guilds/${this.guildId}/users/${member.user?.id}/avatars/${member.avatar}.${extension}?size=${size}`;
  }

  /**
   * The member's guild banner URL
   * @param options - Banner options
   * @returns The banner URL or null if no banner
   */
  public bannerURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string | null {
    const member = this as unknown as APIGuildMember;
    if (!member.banner) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension = options?.extension ?? "png";
    return `https://cdn.discordapp.com/guilds/${this.guildId}/users/${member.user?.id}/banners/${member.banner}.${extension}?size=${size}`;
  }

  /**
   * The timestamp the member joined the guild at
   */
  public get joinedTimestamp(): number | null {
    const member = this as unknown as APIGuildMember;
    if (!member.joined_at) {
      return null;
    }
    return new Date(member.joined_at).getTime();
  }

  /**
   * The date the member joined the guild
   */
  public get joinedAt(): Date | null {
    const member = this as unknown as APIGuildMember;
    if (!member.joined_at) {
      return null;
    }
    return new Date(member.joined_at);
  }

  /**
   * The timestamp the member started boosting the guild
   */
  public get premiumSinceTimestamp(): number | null {
    const member = this as unknown as APIGuildMember;
    if (!member.premium_since) {
      return null;
    }
    return new Date(member.premium_since).getTime();
  }

  /**
   * The date the member started boosting the guild
   */
  public get premiumSince(): Date | null {
    const member = this as unknown as APIGuildMember;
    if (!member.premium_since) {
      return null;
    }
    return new Date(member.premium_since);
  }

  /**
   * The timestamp the member's timeout will expire
   */
  public get communicationDisabledUntilTimestamp(): number | null {
    const member = this as unknown as APIGuildMember;
    if (!member.communication_disabled_until) {
      return null;
    }
    return new Date(member.communication_disabled_until).getTime();
  }

  /**
   * The date the member's timeout will expire
   */
  public get communicationDisabledUntil(): Date | null {
    const member = this as unknown as APIGuildMember;
    if (!member.communication_disabled_until) {
      return null;
    }
    return new Date(member.communication_disabled_until);
  }

  /**
   * Whether the member is currently timed out
   */
  public get isCommunicationDisabled(): boolean {
    const member = this as unknown as APIGuildMember;
    if (!member.communication_disabled_until) {
      return false;
    }
    return new Date(member.communication_disabled_until) > new Date();
  }

  /**
   * Whether the member is boosting the guild
   */
  public get isPremium(): boolean {
    const member = this as unknown as APIGuildMember;
    return member.premium_since !== null;
  }

  /**
   * Whether the member is pending verification
   */
  public get isPending(): boolean {
    const member = this as unknown as APIGuildMember;
    return member.pending ?? false;
  }

  /**
   * Checks if this member has a role
   * @param roleId - The role id to check
   * @returns Whether the member has the role
   */
  public hasRole(roleId: string): boolean {
    const member = this as unknown as APIGuildMember;
    return member.roles.includes(roleId);
  }

  /**
   * Checks if this member has any of the roles
   * @param roleIds - The role ids to check
   * @returns Whether the member has any of the roles
   */
  public hasAnyRole(...roleIds: string[]): boolean {
    const member = this as unknown as APIGuildMember;
    return roleIds.some((id) => member.roles.includes(id));
  }

  /**
   * Checks if this member has all of the roles
   * @param roleIds - The role ids to check
   * @returns Whether the member has all of the roles
   */
  public hasAllRoles(...roleIds: string[]): boolean {
    const member = this as unknown as APIGuildMember;
    return roleIds.every((id) => member.roles.includes(id));
  }

  /**
   * Checks if this member equals another member
   * @param member - The member to compare with
   * @returns Whether the members are equal
   */
  public equals(member: this): boolean {
    const memberA = this as unknown as APIGuildMember;
    const memberB = member as unknown as APIGuildMember;
    return memberA.user?.id === memberB.user?.id && this.guildId === member.guildId;
  }
}

export default MemberStructure as new <T extends APIGuildMember = APIGuildMember>(
  data: T,
  guildId: string,
  client: Client,
) => MemberStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type MemberStructureInstance = InstanceType<typeof MemberStructure> &
  APIGuildMember & { readonly guildId: string; readonly client: Client };
