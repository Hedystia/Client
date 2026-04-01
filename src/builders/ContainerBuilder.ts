import type { APIComponentInContainer, APIContainerComponent } from "discord-api-types/v10";

class ContainerBuilder {
  private readonly data: Partial<APIContainerComponent> = {
    type: 17, // ComponentType.Container
    components: [],
  };

  /**
   * Sets the accent color for the container (RGB hex value)
   * @param color - The accent color as a number (0x000000 to 0xFFFFFF)
   * @returns The current builder
   */
  public setAccentColor(color: number): this {
    this.data.accent_color = color;
    return this;
  }

  /**
   * Sets whether the container should be a spoiler (blurred)
   * @param spoiler - Whether the container is a spoiler
   * @returns The current builder
   */
  public setSpoiler(spoiler: boolean): this {
    this.data.spoiler = spoiler;
    return this;
  }

  /**
   * Adds a component to the container
   * @param component - The component to add (ActionRow, TextDisplay, Section, MediaGallery, Separator, or File)
   * @returns The current builder
   */
  public addComponent(component: APIComponentInContainer): this {
    this.data.components?.push(component);
    return this;
  }

  /**
   * Sets multiple components (replaces all existing components)
   * @param components - Array of components to add
   * @returns The current builder
   */
  public setComponents(components: APIComponentInContainer[]): this {
    this.data.components = components;
    return this;
  }

  /**
   * Gets the built container component
   * @returns The container component data
   */
  public toJSON(): APIContainerComponent {
    return this.data as APIContainerComponent;
  }
}

export default ContainerBuilder;
