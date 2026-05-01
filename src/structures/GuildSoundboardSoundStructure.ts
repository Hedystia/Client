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
