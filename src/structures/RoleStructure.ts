import type { APIRole, RESTPatchAPIGuildRoleJSONBody } from "discord-api-types/v10";
import type Client from "../client";
import { CDN, ImageFormat } from "../utils/constants";

class RoleStructure<T extends APIRole = APIRole> {
  public readonly client: Client;
  public readonly guild_id: string;

  constructor(data: T, guild_id: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.guild_id = guild_id;
    this.client = client;
  }

  /**
   * The role's mention
   */
  public get mention(): string {
    const role = this as unknown as APIRole & { guild_id?: string };
    if (role.guild_id && role.id === role.guild_id) {
      return "@everyone";
    }
    return `<@&${(this as unknown as APIRole).id}>`;
  }

  /**
   * The hex color of the role
   */
  public get hexColor(): string {
    const role = this as unknown as APIRole;
    const hex = role.color.toString(16).padStart(6, "0");
    return `#${hex}`;
  }

  /**
   * The role icon URL.
   *
   * @param options - Icon formatting options.
   * @returns The role icon URL, or null when this role has no icon.
   */
  public iconURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp";
  }): string | null {
    const role = this as unknown as APIRole;
    if (!role.icon) {
      return null;
    }
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.roleIcon(role.id, role.icon, extension as Parameters<typeof CDN.roleIcon>[2])}?size=${options?.size ?? 1024}`;
  }

  /**
   * The timestamp the role was created at
   */
  public get createdTimestamp(): number {
    const role = this as unknown as APIRole;
    return Number((BigInt(role.id) >> 22n) + 1420070400000n);
  }

  /**
   * The date the role was created at
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * Checks if this role equals another role
   * @param role - The role to compare with
   * @returns Whether the roles are equal
   */
  public equals(role: RoleStructureInstance): boolean {
    const roleA = this as unknown as APIRole;
    const roleB = role as unknown as APIRole;
    return roleA.id === roleB.id;
  }

  /**
   * Whether this role is the @everyone role
   */
  public get isEveryone(): boolean {
    const role = this as unknown as APIRole;
    return role.name === "@everyone";
  }

  /**
   * Whether this role is a bot role
   */
  public get isBotRole(): boolean {
    const role = this as unknown as APIRole;
    return role.tags?.bot_id !== undefined;
  }

  /**
   * Whether this role is an integration role
   */
  public get isIntegrationRole(): boolean {
    const role = this as unknown as APIRole;
    return role.tags?.integration_id !== undefined;
  }

  /**
   * Whether this role is a premium subscriber role
   */
  public get isPremiumSubscriberRole(): boolean {
    const role = this as unknown as APIRole;
    return role.tags?.premium_subscriber !== undefined;
  }

  /**
   * Whether this role is available for purchase
   */
  public get isAvailableForPurchase(): boolean {
    const role = this as unknown as APIRole;
    return role.tags?.subscription_listing_id !== undefined;
  }

  /**
   * Whether the role is a guild's linked role
   */
  public get isGuildLinkedRole(): boolean {
    const role = this as unknown as APIRole;
    return role.tags?.guild_connections !== undefined;
  }

  /**
   * Edits this role using Discord's official role edit body.
   *
   * @param data - The official Discord role edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited role, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-role
   */
  public edit(
    data: RESTPatchAPIGuildRoleJSONBody,
    reason?: string,
  ): Promise<RoleStructureInstance | null> {
    const role = this as unknown as APIRole;
    return this.client.roles.edit(this.guild_id, role.id, data, reason);
  }

  /**
   * Deletes this role from its guild.
   *
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/guild#delete-guild-role
   */
  public delete(reason?: string): Promise<void> {
    const role = this as unknown as APIRole;
    return this.client.roles.delete(this.guild_id, role.id, reason);
  }

  /**
   * Moves this role to a new position in its guild.
   *
   * @param position - The target role position.
   * @param reason - Optional audit-log reason.
   * @returns The updated role, or null when it was not included in Discord's response.
   * @see https://docs.discord.com/developers/resources/guild#modify-guild-role-positions
   */
  public async setPosition(
    position: number,
    reason?: string,
  ): Promise<RoleStructureInstance | null> {
    const role = this as unknown as APIRole;
    const roles = await this.client.roles.setPositions(
      this.guild_id,
      [{ id: role.id, position }],
      reason,
    );
    return roles.find((updatedRole) => updatedRole.id === role.id) ?? null;
  }
}

export default RoleStructure as new <T extends APIRole = APIRole>(
  data: T,
  guild_id: string,
  client: Client,
) => RoleStructure<T> & T & { readonly client: Client };

export type RoleStructureInstance<T extends APIRole = APIRole> = RoleStructure<T> &
  T & { readonly client: Client };
