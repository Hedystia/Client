import type { RESTGetAPIStickerPackResult, RESTGetStickerPacksResult } from "discord-api-types/v10";
import type Client from "../client";
import { Routes } from "../utils/constants";

/**
 * Manager for Discord's global sticker-pack resources.
 */
export default class StickerPackManager {
  public readonly client: Client;

  /**
   * @param client - The client used to perform REST requests.
   */
  public constructor(client: Client) {
    this.client = client;
  }

  /**
   * Fetches every available sticker pack.
   * @returns The official sticker-pack response.
   */
  public async fetchAll(): Promise<RESTGetStickerPacksResult | null> {
    return (await this.client.rest.get(Routes.stickerPacks())) as RESTGetStickerPacksResult | null;
  }

  /**
   * Fetches one sticker pack by ID.
   * @param packId - The sticker-pack ID.
   * @returns The sticker pack, or null when Discord returned no data.
   */
  public async fetch(packId: string): Promise<RESTGetAPIStickerPackResult | null> {
    return (await this.client.rest.get(
      Routes.stickerPack(packId),
    )) as RESTGetAPIStickerPackResult | null;
  }
}
