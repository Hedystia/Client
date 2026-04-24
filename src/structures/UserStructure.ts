import type { APIUser } from "discord-api-types/v10";

class UserStructure<T extends APIUser = APIUser> {
  constructor(data: T) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
  }

  /**
   * The user's mention
   */
  public get mention(): string {
    const user = this as unknown as APIUser;
    return `<@${user.id}>`;
  }

  /**
   * The user's nickname mention
   */
  public get nicknameMention(): string {
    const user = this as unknown as APIUser;
    return `<@!${user.id}>`;
  }

  /**
   * The user's avatar URL
   * @param options - Avatar options
   * @returns The avatar URL or null if no avatar
   */
  public avatarURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string | null {
    const user = this as unknown as APIUser;
    if (!user.avatar) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension = options?.extension ?? "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=${size}`;
  }

  /**
   * The user's default avatar URL
   */
  public defaultAvatarURL(): string {
    const user = this as unknown as APIUser;
    const index = Number(BigInt(user.discriminator)) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }

  /**
   * The user's banner URL
   * @param options - Banner options
   * @returns The banner URL or null if no banner
   */
  public bannerURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string | null {
    const user = this as unknown as APIUser;
    if (!user.banner) {
      return null;
    }

    const size = options?.size ?? 1024;
    const extension = options?.extension ?? "png";
    return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${extension}?size=${size}`;
  }

  /**
   * The timestamp the user was created at
   */
  public get createdTimestamp(): number {
    const user = this as unknown as APIUser;
    return Number((BigInt(user.id) >> 22n) + 1420070400000n);
  }

  /**
   * The date the user was created at
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * Checks if this user equals another user
   * @param user - The user to compare with
   * @returns Whether the users are equal
   */
  public equals(user: UserStructureInstance): boolean {
    const userA = this as unknown as APIUser;
    const userB = user as unknown as APIUser;
    return userA.id === userB.id;
  }

  /**
   * Checks if this user is the client user
   * @param clientUserId - The client user's id
   * @returns Whether this user is the client user
   */
  public isClient(clientUserId: string): boolean {
    const user = this as unknown as APIUser;
    return user.id === clientUserId;
  }
}

export default UserStructure as new <T extends APIUser = APIUser>(
  data: T,
) => UserStructure<T> & T;

export type UserStructureInstance = InstanceType<typeof UserStructure> & APIUser;
