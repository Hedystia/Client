import type { APIChannel } from "discord-api-types/v10";
import type Client from "../client";
import type { ChannelStructureInstance } from "../structures/ChannelStructure";
import ChannelStructure from "../structures/ChannelStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class ChannelManager {
  client: Client;
  private readonly _cache = new Cache<string, ChannelStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Adds a channel to the cache
   * @param {ChannelStructureInstance} data The channel data
   * @param {boolean} cache.enabled Whether to enable the channel in the cache
   * @param {boolean} cache.force Whether to force add the channel to the cache
   */
  public _add(
    data: ChannelStructureInstance,
    cache: {
      enabled: boolean;
      force: boolean;
    },
  ): void {
    if (cache.enabled) {
      const channel = this._cache.get(data.id);
      if (channel && !cache.force) {
        return;
      }
      this._cache.set(data.id, data);
    }
  }

  /**
   * Removes a channel from the cache
   * @param {string} id The channel's id
   */
  public _remove(id: string): void {
    this._cache.delete(id);
  }

  /**
   * Updates a channel in the cache
   * @param {ChannelStructureInstance} data The channel data
   */
  public _update(data: ChannelStructureInstance): void {
    this._add(data, { enabled: true, force: true });
  }

  /**
   * Gets a channel from the cache by id
   * @param {string} id The channel's id
   * @returns {ChannelStructureInstance | undefined} The channel or undefined
   */
  public get(id: string): ChannelStructureInstance | undefined {
    return this._cache.get(id);
  }

  /**
   * Sets a channel in the cache
   * @param {string} id The channel's id
   * @param {ChannelStructureInstance} data The channel data
   */
  public set(id: string, data: ChannelStructureInstance): void {
    this._cache.set(id, data);
  }

  /**
   * Fetches a channel from the API
   * @param {string} id The channel's id
   * @param {boolean} options.cache.force Whether to force fetch the channel from the API even if cache is enabled
   * @param {boolean} options.useStructure Whether to use the structure or the raw data
   * @link https://discord.com/developers/docs/resources/channel#get-channel
   * @returns {Promise<APIChannel | ChannelStructureInstance | null>} The channel data
   */
  public async fetch(
    id: string,
    options?: {
      cache?: {
        force: boolean;
      };
      useStructure?: boolean;
    },
  ): Promise<APIChannel | ChannelStructureInstance | null> {
    const cached = this._cache.get(id);
    if (cached && !options?.cache?.force) {
      return cached;
    }

    const channel = (await this.client.rest
      .get(Routes.channel(id))
      .catch(() => null)) as APIChannel | null;
    if (!channel) {
      return null;
    }
    if (options?.useStructure !== false) {
      const channelStructure = new ChannelStructure(channel, this.client);
      this._add(channelStructure, {
        enabled: true,
        force: options?.cache?.force ?? false,
      });
      return channelStructure;
    }
    return channel;
  }

  /**
   * Gets the channels cache
   * @link https://discord.com/developers/docs/resources/channel#channel-object
   * @returns {Cache<string, ChannelStructureInstance>} The channels cache
   */
  public get cache(): Cache<string, ChannelStructureInstance> {
    return this._cache;
  }
}
