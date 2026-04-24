import type { APISoundboardSound } from "discord-api-types/v10";
import type Client from "../client";

class GuildSoundboardSoundStructure<T extends APISoundboardSound = APISoundboardSound> {
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

  public get id(): string {
    return (this as unknown as APISoundboardSound).sound_id;
  }

  public get name(): string {
    return (this as unknown as APISoundboardSound).name;
  }

  public get volume(): number {
    return (this as unknown as APISoundboardSound).volume ?? 1.0;
  }

  public get emojiId(): string | null {
    return (this as unknown as APISoundboardSound).emoji_id ?? null;
  }

  public get emojiName(): string | null {
    return (this as unknown as APISoundboardSound).emoji_name ?? null;
  }

  public get available(): boolean {
    return (this as unknown as APISoundboardSound).available ?? true;
  }
}

export default GuildSoundboardSoundStructure as new <
  T extends APISoundboardSound = APISoundboardSound,
>(
  data: T,
  guildId: string,
  client: Client,
) => GuildSoundboardSoundStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type GuildSoundboardSoundStructureInstance = GuildSoundboardSoundStructure &
  APISoundboardSound & { readonly guildId: string; readonly client: Client };
