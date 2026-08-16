import type { APIComponentInLabel, APILabelComponent } from "discord-api-types/v10";

/**
 * Builds a Discord label component that wraps a modal component.
 *
 * @see https://docs.discord.com/developers/components/reference#label
 */
class LabelBuilder {
  private readonly data: Partial<APILabelComponent> = {
    type: 18,
  };

  /**
   * Sets the visible label text.
   * @param label - The label text displayed above the child component.
   * @returns This builder for chaining.
   */
  public setLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  /**
   * Sets the optional label description.
   * @param description - The descriptive text displayed below the label.
   * @returns This builder for chaining.
   */
  public setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  /**
   * Sets the component wrapped by the label.
   * @param component - An official Discord label-compatible component or builder.
   * @returns This builder for chaining.
   */
  public setComponent(component: APIComponentInLabel | { toJSON(): APIComponentInLabel }): this {
    this.data.component = "toJSON" in component ? component.toJSON() : component;
    return this;
  }

  /**
   * Serializes the component into the official Discord API shape.
   * @returns The label component payload.
   */
  public toJSON(): APILabelComponent {
    return this.data as APILabelComponent;
  }
}

export default LabelBuilder;
