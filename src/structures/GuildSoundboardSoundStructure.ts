import type {
  APISoundboardSound,
  RESTPatchAPIGuildSoundboardSoundJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import { CDN } from "../utils/constants";

class GuildSoundboardSoundStructure<T extends APISoundboardSound = APISoundboardSound> {
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.guildId = guildId;
    this.client = client;
  }

  /**
   * The soundboard sound CDN URL.
   *
   * @returns The sound URL for this sound.
   */
  public get url(): string {
    const sound = this as unknown as APISoundboardSound;
    return CDN.soundboardSound(sound.sound_id);
  }

  /**
   * Edits this soundboard sound.
   *
   * @param data - The official Discord soundboard edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited sound, or null when Discord returned no data.
   */
  public edit(
    data: RESTPatchAPIGuildSoundboardSoundJSONBody,
    reason?: string,
  ): Promise<GuildSoundboardSoundStructureInstance | null> {
    const sound = this as unknown as APISoundboardSound;
    return this.client.soundboardSounds.edit(this.guildId, sound.sound_id, data, reason);
  }

  /**
   * Deletes this soundboard sound.
   *
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   */
  public delete(reason?: string): Promise<void> {
    const sound = this as unknown as APISoundboardSound;
    return this.client.soundboardSounds.delete(this.guildId, sound.sound_id, reason);
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
