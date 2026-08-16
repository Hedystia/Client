import type {
  APIApplicationEmoji,
  RESTGetAPIApplicationEmojiResult,
  RESTGetAPIApplicationEmojisResult,
  RESTPatchAPIApplicationEmojiJSONBody,
  RESTPatchAPIApplicationEmojiResult,
  RESTPostAPIApplicationEmojiJSONBody,
  RESTPostAPIApplicationEmojiResult,
} from "discord-api-types/v10";
import type Client from "../client";
import { Collection } from "../utils/Collection";
import { Routes } from "../utils/constants";

/**
 * Manages application-owned custom emojis using Discord's official REST API.
 */
export default class ApplicationEmojiManager {
  public readonly client: Client;
  private readonly _cache = new Collection<string, APIApplicationEmoji>();

  /**
   * @param client - The client instance that owns this manager.
   */
  public constructor(client: Client) {
    this.client = client;
  }

  /**
   * Resolves the current application ID.
   * @returns The application ID.
   */
  private applicationId(): string {
    const applicationId = this.client.me?.id;
    if (!applicationId) {
      throw new Error("Client is not logged in");
    }
    return applicationId;
  }

  /**
   * Fetches one application emoji or all application emojis.
   *
   * @param emojiId - An emoji ID to fetch individually.
   * @param force - Whether to bypass the local cache for an individual emoji.
   * @returns An official emoji payload or a collection of payloads.
   * @see https://docs.discord.com/developers/resources/emoji#list-application-emojis
   */
  public async fetch(emojiId: string, force?: boolean): Promise<APIApplicationEmoji | null>;
  public async fetch(): Promise<Collection<string, APIApplicationEmoji>>;
  public async fetch(
    emojiId?: string,
    force = false,
  ): Promise<APIApplicationEmoji | null | Collection<string, APIApplicationEmoji>> {
    const applicationId = this.applicationId();
    if (emojiId) {
      const cached = this._cache.get(emojiId);
      if (cached && !force) {
        return cached;
      }

      const emoji = (await this.client.rest.get(
        Routes.applicationEmoji(applicationId, emojiId),
      )) as RESTGetAPIApplicationEmojiResult | null;
      if (emoji) {
        this._cache.set(emoji.id, emoji);
      }
      return emoji;
    }

    const response = (await this.client.rest.get(
      Routes.applicationEmojis(applicationId),
    )) as RESTGetAPIApplicationEmojisResult | null;
    const result = new Collection<string, APIApplicationEmoji>();
    for (const emoji of response?.items ?? []) {
      result.set(emoji.id, emoji);
      this._cache.set(emoji.id, emoji);
    }
    return result;
  }

  /**
   * Creates an application emoji.
   *
   * @param data - The official Discord application-emoji body.
   * @returns The created emoji, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/emoji#create-application-emoji
   */
  public async create(
    data: RESTPostAPIApplicationEmojiJSONBody,
  ): Promise<APIApplicationEmoji | null> {
    const emoji = (await this.client.rest.post(Routes.applicationEmojis(this.applicationId()), {
      body: data,
    })) as RESTPostAPIApplicationEmojiResult | null;
    if (emoji) {
      this._cache.set(emoji.id, emoji);
    }
    return emoji;
  }

  /**
   * Edits an application emoji.
   *
   * @param emojiId - The emoji ID.
   * @param data - The official Discord application-emoji edit body.
   * @returns The edited emoji, or null when Discord returned no data.
   * @see https://docs.discord.com/developers/resources/emoji#modify-application-emoji
   */
  public async edit(
    emojiId: string,
    data: RESTPatchAPIApplicationEmojiJSONBody,
  ): Promise<APIApplicationEmoji | null> {
    const emoji = (await this.client.rest.patch(
      Routes.applicationEmoji(this.applicationId(), emojiId),
      { body: data },
    )) as RESTPatchAPIApplicationEmojiResult | null;
    if (emoji) {
      this._cache.set(emoji.id, emoji);
    }
    return emoji;
  }

  /**
   * Deletes an application emoji.
   *
   * @param emojiId - The emoji ID.
   * @returns A promise that resolves when Discord accepts the request.
   * @see https://docs.discord.com/developers/resources/emoji#delete-application-emoji
   */
  public async delete(emojiId: string): Promise<void> {
    await this.client.rest.delete(Routes.applicationEmoji(this.applicationId(), emojiId));
    this._cache.delete(emojiId);
  }

  /**
   * Gets the application emoji cache.
   * @returns Cached official application emoji payloads.
   */
  public get cache(): Collection<string, APIApplicationEmoji> {
    return this._cache;
  }
}
