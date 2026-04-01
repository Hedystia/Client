import type { APITextDisplayComponent } from "discord-api-types/v10";

class TextDisplayBuilder {
  private readonly data: Partial<APITextDisplayComponent> = {
    type: 10, // ComponentType.TextDisplay
  };

  /**
   * Sets the text content with markdown support
   * @param content - The text content
   * @returns The current builder
   */
  public setContent(content: string): this {
    this.data.content = content;
    return this;
  }

  /**
   * Gets the built text display component
   * @returns The text display component data
   */
  public toJSON(): APITextDisplayComponent {
    return this.data as APITextDisplayComponent;
  }
}

export default TextDisplayBuilder;
