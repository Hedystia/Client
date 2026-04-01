import type { APISticker } from "discord-api-types/v10";
import type Client from "../client";

class GuildStickerStructure<T extends APISticker = APISticker> {
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    Object.assign(this, data);
    this.guildId = guildId;
    this.client = client;
  }

  /**
   * The sticker's URL
   */
  public imageURL(options?: {
    size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
    extension?: "png" | "jpg" | "json";
  }): string {
    const sticker = this as unknown as APISticker & { id: string; format_type: number };
    const size = options?.size ?? 1024;
    const extension = options?.extension ?? (sticker.format_type === 3 ? "json" : "png");
    return `https://cdn.discordapp.com/stickers/${sticker.id}.${extension}?size=${size}`;
  }

  /**
   * The timestamp the sticker was created at
   */
  public get createdTimestamp(): number {
    const sticker = this as unknown as APISticker & { id: string };
    return Number((BigInt(sticker.id) >> 22n) + 1420070400000n);
  }

  /**
   * The date the sticker was created at
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * Whether the sticker is available
   */
  public get isAvailable(): boolean {
    const sticker = this as unknown as APISticker & { available?: boolean };
    return sticker.available ?? true;
  }

  /**
   * Whether the sticker is managed
   */
  public get isManaged(): boolean {
    const sticker = this as unknown as APISticker & { user?: unknown };
    return sticker.user !== undefined;
  }

  /**
   * Checks if this sticker equals another sticker
   * @param sticker - The sticker to compare with
   * @returns Whether the stickers are equal
   */
  public equals(sticker: GuildStickerStructureInstance): boolean {
    const stickerA = this as unknown as APISticker & { id: string; guild_id?: string };
    const stickerB = sticker as unknown as APISticker & { id: string; guild_id?: string };
    return stickerA.id === stickerB.id && this.guildId === stickerB.guild_id;
  }
}

export default GuildStickerStructure as new <T extends APISticker = APISticker>(
  data: T,
  guildId: string,
  client: Client,
) => GuildStickerStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type GuildStickerStructureInstance = InstanceType<typeof GuildStickerStructure> &
  APISticker & { readonly guildId: string; readonly client: Client };
