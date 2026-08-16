import type {
  APIGuildMember,
  RESTPatchAPIGuildMemberJSONBody,
  Snowflake,
} from "discord-api-types/v10";
import type Client from "../client";
import Cache from "../utils/cache";
import { CDN, ImageFormat, Routes } from "../utils/constants";
import type { RoleStructureInstance } from "./RoleStructure";

/**
 * A small manager for the roles assigned to a member.
 */
export interface MemberRoleManager {
  /** The roles currently present in the role cache. */
  readonly cache: Cache<string, RoleStructureInstance>;
  /** Adds one or more roles to the member. */
  add(roleIds: Snowflake | Snowflake[], reason?: string): Promise<MemberStructureInstance | null>;
  /** Removes one or more roles from the member. */
  remove(
    roleIds: Snowflake | Snowflake[],
    reason?: string,
  ): Promise<MemberStructureInstance | null>;
  /** Replaces all roles assigned to the member. */
  set(roleIds: Snowflake[], reason?: string): Promise<MemberStructureInstance | null>;
}

class MemberStructure<T extends APIGuildMember = APIGuildMember> {
  private readonly roleIds: Snowflake[];
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    this.roleIds = [...(data.roles ?? [])];
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
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
    if (!member.avatar || !member.user?.id) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.guildMemberAvatar(this.guildId, member.user.id, member.avatar, extension as Parameters<typeof CDN.guildMemberAvatar>[3])}?size=${size}`;
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
    if (!member.banner || !member.user?.id) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.guildMemberBanner(this.guildId, member.user.id, member.banner, extension as Parameters<typeof CDN.guildMemberBanner>[3])}?size=${size}`;
  }

  /**
   * The member's display avatar URL.
   *
   * The member avatar is preferred, followed by the user's global avatar and
   * finally the deterministic default user avatar.
   *
   * @param options - Avatar formatting options.
   * @returns The best available avatar URL.
   */
  public displayAvatarURL(options?: Parameters<MemberStructure["avatarURL"]>[0]): string {
    const member = this as unknown as APIGuildMember;
    const size = options?.size ?? 1024;
    const requestedExtension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    const extension = requestedExtension as Parameters<typeof CDN.userAvatar>[2];

    if (member.avatar && member.user?.id) {
      return `${CDN.guildMemberAvatar(this.guildId, member.user.id, member.avatar, extension as Parameters<typeof CDN.guildMemberAvatar>[3])}?size=${size}`;
    }
    if (member.user?.avatar) {
      return `${CDN.userAvatar(member.user.id, member.user.avatar, extension)}?size=${size}`;
    }
    return CDN.defaultUserAvatar(
      Number((BigInt(member.user?.id ?? "0") >> 22n) % 6n) as Parameters<
        typeof CDN.defaultUserAvatar
      >[0],
    );
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
    return this.roleIds.includes(roleId);
  }

  /**
   * Checks if this member has any of the roles
   * @param roleIds - The role ids to check
   * @returns Whether the member has any of the roles
   */
  public hasAnyRole(...roleIds: string[]): boolean {
    return roleIds.some((id) => this.roleIds.includes(id));
  }

  /**
   * Checks if this member has all of the roles
   * @param roleIds - The role ids to check
   * @returns Whether the member has all of the roles
   */
  public hasAllRoles(...roleIds: string[]): boolean {
    return roleIds.every((id) => this.roleIds.includes(id));
  }

  /**
   * Fetches the latest member data from Discord.
   * @returns The refreshed member structure, or null if no data was returned.
   */
  public async fetch(): Promise<MemberStructureInstance | null> {
    const member = this as unknown as APIGuildMember;
    const data = (await this.client.rest.get(
      Routes.guildMember(this.guildId, member.user.id),
    )) as APIGuildMember | null;
    if (!data) {
      return null;
    }
    const structure = new MemberStructure(
      data,
      this.guildId,
      this.client,
    ) as MemberStructureInstance;
    this.client.members.set(this.guildId, data.user.id, structure);
    return structure;
  }

  /**
   * Edits this member using Discord's official member-edit body.
   * @param data - The official member fields to update.
   * @param reason - Optional audit-log reason.
   * @returns The edited member, or null if no data was returned.
   */
  public async edit(
    data: RESTPatchAPIGuildMemberJSONBody,
    reason?: string,
  ): Promise<MemberStructureInstance | null> {
    const member = this as unknown as APIGuildMember;
    const updated = (await this.client.rest.patch(
      Routes.guildMember(this.guildId, member.user.id),
      { body: data, reason },
    )) as APIGuildMember | null;
    if (!updated) {
      return null;
    }
    const structure = new MemberStructure(
      updated,
      this.guildId,
      this.client,
    ) as MemberStructureInstance;
    this.client.members.set(this.guildId, updated.user.id, structure);
    return structure;
  }

  /**
   * Changes or clears this member's nickname.
   * @param nickname - The new nickname, or null to clear it.
   * @param reason - Optional audit-log reason.
   * @returns The edited member, or null if no data was returned.
   */
  public setNickname(
    nickname: string | null,
    reason?: string,
  ): Promise<MemberStructureInstance | null> {
    return this.edit({ nick: nickname }, reason);
  }

  /**
   * Kicks this member from the guild.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the kick.
   */
  public async kick(reason?: string): Promise<void> {
    const member = this as unknown as APIGuildMember;
    await this.client.rest.delete(Routes.guildMember(this.guildId, member.user.id), { reason });
    this.client.members._remove(this.guildId, member.user.id);
  }

  /**
   * Bans this member from the guild.
   * @param options - Optional message-deletion duration and audit-log reason.
   * @returns A promise that resolves when Discord accepts the ban.
   */
  public async ban(options?: { deleteMessageSeconds?: number; reason?: string }): Promise<void> {
    const member = this as unknown as APIGuildMember;
    await this.client.bans.create(this.guildId, member.user.id, options);
  }

  /**
   * Times out or removes the timeout from this member.
   * @param duration - Timeout duration in milliseconds, or null to remove the timeout.
   * @param reason - Optional audit-log reason.
   * @returns The edited member, or null if no data was returned.
   */
  public timeout(
    duration: number | null,
    reason?: string,
  ): Promise<MemberStructureInstance | null> {
    const communicationDisabledUntil =
      duration === null ? null : new Date(Date.now() + duration).toISOString();
    return this.edit({ communication_disabled_until: communicationDisabledUntil }, reason);
  }

  /**
   * Provides a role manager for this member.
   * @returns The member role manager.
   */
  public get roles(): MemberRoleManager {
    const member = this as unknown as APIGuildMember;
    const cache = new Cache<string, RoleStructureInstance>();
    for (const roleId of this.roleIds) {
      const role = this.client.roles.get(roleId);
      if (role && role.guild_id === this.guildId) {
        cache.set(roleId, role);
      }
    }

    const resolveIds = (roleIds: Snowflake | Snowflake[]) =>
      typeof roleIds === "string" ? [roleIds] : roleIds;
    return {
      cache,
      add: async (roleIds: Snowflake | Snowflake[], reason?: string) => {
        const ids = resolveIds(roleIds);
        if (ids.length === 0) {
          return this.fetch();
        }
        await Promise.all(
          ids.map((roleId) =>
            this.client.rest.put(Routes.guildMemberRole(this.guildId, member.user.id, roleId), {
              reason,
            }),
          ),
        );
        return this.fetch();
      },
      remove: async (roleIds: Snowflake | Snowflake[], reason?: string) => {
        const ids = resolveIds(roleIds);
        if (ids.length === 0) {
          return this.fetch();
        }
        await Promise.all(
          ids.map((roleId) =>
            this.client.rest.delete(Routes.guildMemberRole(this.guildId, member.user.id, roleId), {
              reason,
            }),
          ),
        );
        return this.fetch();
      },
      set: (roleIds: Snowflake[], reason?: string) => this.edit({ roles: roleIds }, reason),
    };
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

export type MemberStructureInstance = MemberStructure<APIGuildMember> &
  APIGuildMember & { readonly guildId: string; readonly client: Client };
