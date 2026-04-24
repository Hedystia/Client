import type { APIEmoji } from "discord-api-types/v10";
import type Client from "../client";

class GuildEmojiStructure<T extends APIEmoji = APIEmoji> {
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.guildId = guildId;
    this.client = client;
  }

  /**
   * The emoji's mention
   */
  public get mention(): string {
    const emoji = this as unknown as APIEmoji & { id: string; name: string; animated?: boolean };
    return emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
  }

  /**
   * The emoji's URL
   */
  public imageURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "webp" | "gif";
  }): string {
    const emoji = this as unknown as APIEmoji & { id: string; animated?: boolean };
    const size = options?.size ?? 1024;
    const extension = options?.extension ?? (emoji.animated ? "gif" : "png");
    return `https://cdn.discordapp.com/emojis/${emoji.id}.${extension}?size=${size}`;
  }

  /**
   * The timestamp the emoji was created at
   */
  public get createdTimestamp(): number {
    const emoji = this as unknown as APIEmoji & { id: string };
    return Number((BigInt(emoji.id) >> 22n) + 1420070400000n);
  }

  /**
   * The date the emoji was created at
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * Whether the emoji is managed
   */
  public get isManaged(): boolean {
    const emoji = this as unknown as APIEmoji & { managed?: boolean };
    return emoji.managed ?? false;
  }

  /**
   * Whether the emoji requires colons
   */
  public get requiresColons(): boolean {
    const emoji = this as unknown as APIEmoji & { require_colons?: boolean };
    return emoji.require_colons ?? false;
  }

  /**
   * Checks if this emoji equals another emoji
   * @param emoji - The emoji to compare with
   * @returns Whether the emojis are equal
   */
  public equals(emoji: GuildEmojiStructureInstance): boolean {
    const emojiA = this as unknown as APIEmoji & { id: string };
    const emojiB = emoji as unknown as APIEmoji & { id: string };
    return emojiA.id === emojiB.id && this.guildId === emoji.guildId;
  }
}

export default GuildEmojiStructure as new <T extends APIEmoji = APIEmoji>(
  data: T,
  guildId: string,
  client: Client,
) => GuildEmojiStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type GuildEmojiStructureInstance = InstanceType<typeof GuildEmojiStructure> &
  APIEmoji & { readonly guildId: string; readonly client: Client };
