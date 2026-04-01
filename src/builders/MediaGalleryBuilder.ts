import type { APIMediaGalleryComponent, APIMediaGalleryItem } from "discord-api-types/v10";

class MediaGalleryBuilder {
  private readonly data: Partial<APIMediaGalleryComponent> = {
    type: 12, // ComponentType.MediaGallery
    items: [],
  };

  /**
   * Adds a media item to the gallery
   * @param url - The URL of the media
   * @param description - Optional alt text description
   * @param spoiler - Whether the media is a spoiler
   * @returns The current builder
   */
  public addItem(url: string, description?: string, spoiler?: boolean): this {
    const item: APIMediaGalleryItem = {
      media: { url },
      description: description ?? null,
      spoiler: spoiler ?? false,
    };
    this.data.items?.push(item);
    return this;
  }

  /**
   * Sets multiple media items (replaces all existing items)
   * @param items - Array of media items with url, description, and spoiler
   * @returns The current builder
   */
  public setItems(items: Array<{ url: string; description?: string; spoiler?: boolean }>): this {
    this.data.items = items.map((item) => ({
      media: { url: item.url },
      description: item.description ?? null,
      spoiler: item.spoiler ?? false,
    }));
    return this;
  }

  /**
   * Gets the built media gallery component
   * @returns The media gallery component data
   */
  public toJSON(): APIMediaGalleryComponent {
    return this.data as APIMediaGalleryComponent;
  }
}

export default MediaGalleryBuilder;
