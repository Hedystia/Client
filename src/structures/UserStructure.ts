import type {
  APIChannel,
  APIMessage,
  APIUser,
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPICurrentUserCreateDMChannelJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import { CDN, ImageFormat, Routes } from "../utils/constants";
import type { ChannelStructureInstance } from "./ChannelStructure";
import ChannelStructure from "./ChannelStructure";
import type { MessageStructureInstance } from "./MessageStructure";
import MessageStructure from "./MessageStructure";

class UserStructure<T extends APIUser = APIUser> {
  public readonly client?: Client;

  constructor(data: T, client?: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }

  /**
   * The user's mention.
   */
  public get mention(): string {
    const user = this as unknown as APIUser;
    return `<@${user.id}>`;
  }

  /**
   * The user's nickname mention.
   */
  public get nicknameMention(): string {
    const user = this as unknown as APIUser;
    return `<@!${user.id}>`;
  }

  /**
   * The user's avatar URL.
   *
   * @param options - Avatar formatting options.
   * @returns The avatar URL or null if the user has no custom avatar.
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
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.userAvatar(user.id, user.avatar, extension as Parameters<typeof CDN.userAvatar>[2])}?size=${size}`;
  }

  /**
   * The user's display avatar URL.
   *
   * @param options - Avatar formatting options.
   * @returns The custom avatar URL, or the default avatar URL when no custom avatar exists.
   */
  public displayAvatarURL(options?: Parameters<UserStructure["avatarURL"]>[0]): string {
    return this.avatarURL(options) ?? this.defaultAvatarURL();
  }

  /**
   * The user's default avatar URL.
   *
   * @returns The default avatar URL.
   */
  public defaultAvatarURL(): string {
    const user = this as unknown as APIUser;
    const index = Number((BigInt(user.id) >> 22n) % 6n);
    return CDN.defaultUserAvatar(index as Parameters<typeof CDN.defaultUserAvatar>[0]);
  }

  /**
   * The user's banner URL.
   *
   * @param options - Banner formatting options.
   * @returns The banner URL or null if the user has no banner.
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
    const extension =
      options?.extension === "jpg" ? ImageFormat.JPEG : (options?.extension ?? ImageFormat.PNG);
    return `${CDN.userBanner(user.id, user.banner, extension as Parameters<typeof CDN.userBanner>[2])}?size=${size}`;
  }

  /**
   * The timestamp the user was created at.
   */
  public get createdTimestamp(): number {
    const user = this as unknown as APIUser;
    return Number((BigInt(user.id) >> 22n) + 1420070400000n);
  }

  /**
   * The date the user was created at.
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * Fetches the latest user data from Discord.
   *
   * @returns The refreshed user, or null when the client is unavailable or Discord returned no data.
   * @see https://docs.discord.com/developers/resources/user#get-user
   */
  public fetch(): Promise<UserStructureInstance | null> {
    const user = this as unknown as APIUser;
    if (!this.client) {
      return Promise.reject(new Error("This user is not attached to a client"));
    }
    return this.client.users.fetch(user.id, { cache: { force: true } });
  }

  /**
   * Creates or fetches a direct-message channel with this user.
   *
   * @returns The direct-message channel.
   * @see https://docs.discord.com/developers/resources/user#create-dm
   */
  public async createDM(): Promise<ChannelStructureInstance> {
    const user = this as unknown as APIUser;
    if (!this.client) {
      throw new Error("This user is not attached to a client");
    }

    const body: RESTPostAPICurrentUserCreateDMChannelJSONBody = {
      recipient_id: user.id,
    };
    const channel = (await this.client.rest.post(Routes.userChannels(), {
      body,
    })) as APIChannel;
    const structure = new ChannelStructure(
      channel,
      this.client,
    ) as unknown as ChannelStructureInstance;
    this.client.channels.set(channel.id, structure);
    return structure;
  }

  /**
   * Sends a direct message to this user.
   *
   * @param content - The message content or official Discord message body.
   * @returns The sent message, or null when Discord returned no data.
   */
  public async send(
    content: string | RESTPostAPIChannelMessageJSONBody,
  ): Promise<MessageStructureInstance | null> {
    const client = this.client;
    if (!client) {
      throw new Error("This user is not attached to a client");
    }
    const channel = await this.createDM();
    const body = typeof content === "string" ? { content } : content;
    const message = (await client.rest.post(Routes.channelMessages(channel.id), {
      body,
    })) as APIMessage | null;
    if (!message) {
      return null;
    }
    return new MessageStructure(
      message,
      channel.id,
      null,
      client,
    ) as unknown as MessageStructureInstance;
  }

  /**
   * Checks if this user equals another user.
   *
   * @param user - The user to compare with.
   * @returns Whether the users are equal.
   */
  public equals(user: UserStructureInstance): boolean {
    const userA = this as unknown as APIUser;
    const userB = user as unknown as APIUser;
    return userA.id === userB.id;
  }

  /**
   * Checks if this user is the client user.
   *
   * @param clientUserId - The client user's ID.
   * @returns Whether this user is the client user.
   */
  public isClient(clientUserId: string): boolean {
    const user = this as unknown as APIUser;
    return user.id === clientUserId;
  }
}

export default UserStructure as new <T extends APIUser = APIUser>(
  data: T,
  client?: Client,
) => UserStructure<T> & T;

/**
 * Client-backed user structure exposed by the library.
 *
 * The Discord fields extend the official `APIUser` payload; the additional
 * members are library helpers rather than a replacement for Discord's type.
 */
export interface UserStructureInstance extends APIUser {
  readonly client?: Client;
  readonly mention: string;
  readonly nicknameMention: string;
  avatarURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string | null;
  displayAvatarURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string;
  defaultAvatarURL(): string;
  bannerURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string | null;
  fetch(): Promise<UserStructureInstance | null>;
  createDM(): Promise<ChannelStructureInstance>;
  send(
    content: string | RESTPostAPIChannelMessageJSONBody,
  ): Promise<MessageStructureInstance | null>;
  equals(user: UserStructureInstance): boolean;
  isClient(clientUserId: string): boolean;
}
