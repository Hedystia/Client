import type { APIThumbnailComponent } from "discord-api-types/v10";

class ThumbnailBuilder {
  private readonly data: Partial<APIThumbnailComponent> = {
    type: 11, // ComponentType.Thumbnail
  };

  /**
   * Sets the media URL for the thumbnail
   * @param url - The URL of the media (supports arbitrary URLs and attachment://<filename>)
   * @returns The current builder
   */
  public setUrl(url: string): this {
    this.data.media = { url };
    return this;
  }

  /**
   * Sets the alt text description for the thumbnail
   * @param description - The alt text description
   * @returns The current builder
   */
  public setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  /**
   * Sets whether the thumbnail should be a spoiler (blurred)
   * @param spoiler - Whether the thumbnail is a spoiler
   * @returns The current builder
   */
  public setSpoiler(spoiler: boolean): this {
    this.data.spoiler = spoiler;
    return this;
  }

  /**
   * Gets the built thumbnail component
   * @returns The thumbnail component data
   */
  public toJSON(): APIThumbnailComponent {
    return this.data as APIThumbnailComponent;
  }
}

export default ThumbnailBuilder;
