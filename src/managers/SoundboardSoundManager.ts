import type {
  APISoundboardSound,
  RESTDeleteAPIGuildSoundboardSoundResult,
  RESTGetAPIGuildSoundboardSoundsResult,
  RESTGetAPISoundboardDefaultSoundsResult,
  RESTPatchAPIGuildSoundboardSoundJSONBody,
  RESTPostAPIGuildSoundboardSoundJSONBody,
  RESTPostAPISendSoundboardSoundResult,
  RESTPostAPISoundboardSendSoundJSONBody,
} from "discord-api-types/v10";
import type Client from "../client";
import type { GuildSoundboardSoundStructureInstance } from "../structures/GuildSoundboardSoundStructure";
import GuildSoundboardSoundStructure from "../structures/GuildSoundboardSoundStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

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
    if (cache.enabled && data.sound_id) {
      const sound = this._cache.get(data.sound_id);
      if (sound && !cache.force) {
        return;
      }
      this._cache.set(data.sound_id, data);
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

    const response = (await this.client.rest.get(
      Routes.guildSoundboardSounds(guildId),
    )) as RESTGetAPIGuildSoundboardSoundsResult | null;
    const sounds = response?.items;

    if (!sounds) {
      return cached;
    }

    return sounds.map((sound) => {
      const soundStructure = new GuildSoundboardSoundStructure(sound, guildId, this.client);
      this._add(soundStructure, { enabled: true, force: false });
      return soundStructure;
    });
  }

  /**
   * Fetches one custom soundboard sound.
   *
   * @param guildId - The guild ID.
   * @param soundId - The sound ID.
   * @returns The sound, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/soundboard#get-guild-soundboard-sound
   */
  public async fetchOne(
    guildId: string,
    soundId: string,
  ): Promise<GuildSoundboardSoundStructureInstance | null> {
    const sound = (await this.client.rest.get(
      Routes.guildSoundboardSound(guildId, soundId),
    )) as APISoundboardSound | null;
    if (!sound) {
      return null;
    }
    const structure = new GuildSoundboardSoundStructure(sound, guildId, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Fetches Discord's default soundboard sounds.
   *
   * @returns The official default soundboard sounds, or an empty array when no data was returned.
   * @see https://docs.discord.com/developers/resources/soundboard#list-soundboard-default-sounds
   */
  public async fetchDefault(): Promise<RESTGetAPISoundboardDefaultSoundsResult> {
    return (
      ((await this.client.rest.get(
        Routes.soundboardDefaultSounds(),
      )) as RESTGetAPISoundboardDefaultSoundsResult | null) ?? []
    );
  }

  /**
   * Creates a custom soundboard sound in a guild.
   *
   * @param guildId - The guild ID.
   * @param data - The official Discord soundboard creation body.
   * @param reason - Optional audit-log reason.
   * @returns The created sound, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/soundboard#create-guild-soundboard-sound
   */
  public async create(
    guildId: string,
    data: RESTPostAPIGuildSoundboardSoundJSONBody,
    reason?: string,
  ): Promise<GuildSoundboardSoundStructureInstance | null> {
    const sound = (await this.client.rest.post(Routes.guildSoundboardSounds(guildId), {
      body: data,
      reason,
    })) as APISoundboardSound | null;
    if (!sound) {
      return null;
    }
    const structure = new GuildSoundboardSoundStructure(sound, guildId, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Edits a custom soundboard sound.
   *
   * @param guildId - The guild ID.
   * @param soundId - The sound ID.
   * @param data - The official Discord soundboard edit body.
   * @param reason - Optional audit-log reason.
   * @returns The edited sound, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/soundboard#modify-guild-soundboard-sound
   */
  public async edit(
    guildId: string,
    soundId: string,
    data: RESTPatchAPIGuildSoundboardSoundJSONBody,
    reason?: string,
  ): Promise<GuildSoundboardSoundStructureInstance | null> {
    const sound = (await this.client.rest.patch(Routes.guildSoundboardSound(guildId, soundId), {
      body: data,
      reason,
    })) as APISoundboardSound | null;
    if (!sound) {
      return null;
    }
    const structure = new GuildSoundboardSoundStructure(sound, guildId, this.client);
    this._add(structure, { enabled: true, force: true });
    return structure;
  }

  /**
   * Deletes a custom soundboard sound.
   *
   * @param guildId - The guild ID.
   * @param soundId - The sound ID.
   * @param reason - Optional audit-log reason.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/soundboard#delete-guild-soundboard-sound
   */
  public async delete(
    guildId: string,
    soundId: string,
    reason?: string,
  ): Promise<RESTDeleteAPIGuildSoundboardSoundResult> {
    await this.client.rest.delete(Routes.guildSoundboardSound(guildId, soundId), { reason });
    this._remove(soundId);
  }

  /**
   * Plays a soundboard sound in a voice channel.
   *
   * @param channelId - The voice channel ID.
   * @param data - The official Discord soundboard-send body.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/soundboard#send-soundboard-sound
   */
  public async send(
    channelId: string,
    data: RESTPostAPISoundboardSendSoundJSONBody,
  ): Promise<RESTPostAPISendSoundboardSoundResult> {
    await this.client.rest.post(Routes.sendSoundboardSound(channelId), {
      body: data,
    });
  }

  /**
   * Gets the soundboard sound cache.
   *
   * @returns The soundboard sound cache.
   */
  public get cache(): Cache<string, GuildSoundboardSoundStructureInstance> {
    return this._cache;
  }
}
