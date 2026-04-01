import type { APISeparatorComponent } from "discord-api-types/v10";

export enum SeparatorSpacingSize {
  Small = 1,
  Large = 2,
}

class SeparatorBuilder {
  private readonly data: Partial<APISeparatorComponent> = {
    type: 14, // ComponentType.Separator
  };

  /**
   * Sets whether a visual divider should be displayed
   * @param divider - Whether to show the divider line
   * @returns The current builder
   */
  public setDivider(divider: boolean): this {
    this.data.divider = divider;
    return this;
  }

  /**
   * Sets the spacing size of the separator
   * @param spacing - The spacing size (Small or Large)
   * @returns The current builder
   */
  public setSpacing(spacing: SeparatorSpacingSize): this {
    this.data.spacing = spacing;
    return this;
  }

  /**
   * Gets the built separator component
   * @returns The separator component data
   */
  public toJSON(): APISeparatorComponent {
    return this.data as APISeparatorComponent;
  }
}

export default SeparatorBuilder;
