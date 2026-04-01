import type {
  APISectionAccessoryComponent,
  APISectionComponent,
  APITextDisplayComponent,
} from "discord-api-types/v10";

class SectionBuilder {
  private readonly data: Partial<APISectionComponent> = {
    type: 9, // ComponentType.Section
    components: [],
  };

  /**
   * Adds text content to the section
   * @param content - The text content with markdown support
   * @returns The current builder
   */
  public addText(content: string): this {
    const textDisplay: APITextDisplayComponent = {
      type: 10, // ComponentType.TextDisplay
      content,
    };
    this.data.components?.push(textDisplay);
    return this;
  }

  /**
   * Sets the text content (replaces all existing text)
   * @param content - The text content with markdown support
   * @returns The current builder
   */
  public setText(content: string): this {
    this.data.components = [
      {
        type: 10, // ComponentType.TextDisplay
        content,
      },
    ];
    return this;
  }

  /**
   * Sets the accessory component for the section
   * @param accessory - The accessory component (Button, Thumbnail, etc.)
   * @returns The current builder
   */
  public setAccessory(accessory: APISectionAccessoryComponent): this {
    this.data.accessory = accessory;
    return this;
  }

  /**
   * Gets the built section component
   * @returns The section component data
   */
  public toJSON(): APISectionComponent {
    return this.data as APISectionComponent;
  }
}

export default SectionBuilder;
