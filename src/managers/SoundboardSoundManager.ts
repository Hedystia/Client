import type { APISoundboardSound } from "discord-api-types/v10";
import type Client from "../client";
import type { GuildSoundboardSoundStructureInstance } from "../structures/GuildSoundboardSoundStructure";
import GuildSoundboardSoundStructure from "../structures/GuildSoundboardSoundStructure";
import Cache from "../utils/cache";

export default class SoundboardSoundManager {
  client: Client;
  private readonly _cache = new Cache<string, GuildSoundboardSoundStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(
    data: GuildSoundboardSoundStructureInstance,
    cache: { enabled: boolean; force: boolean },
  ): void {
    if (cache.enabled && data.id) {
      const sound = this._cache.get(data.id);
      if (sound && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  public _remove(id: string): void {
    this._cache.delete(id);
  }

  public get(id: string): GuildSoundboardSoundStructureInstance | undefined {
    return this._cache.get(id);
  }

  public async fetch(
    guildId: string,
    options?: { cache?: { force: boolean } },
  ): Promise<GuildSoundboardSoundStructureInstance[]> {
    const cached: GuildSoundboardSoundStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const sound of this._cache.values()) {
        if (sound.guildId === guildId) {
          cached.push(sound);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const sounds = (await this.client.rest.get(`/guilds/${guildId}/soundboard-sounds`)) as
      | APISoundboardSound[]
      | null;

    if (!sounds) {
      return cached;
    }

    return sounds.map((sound) => {
      const soundStructure = new GuildSoundboardSoundStructure(sound, guildId, this.client);
      this._add(soundStructure, { enabled: true, force: false });
      return soundStructure;
    });
  }

  public get cache(): Cache<string, GuildSoundboardSoundStructureInstance> {
    return this._cache;
  }
}
