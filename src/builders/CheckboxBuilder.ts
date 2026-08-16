import type { APICheckboxComponent } from "discord-api-types/v10";

/**
 * Builds a Discord checkbox component.
 *
 * @see https://docs.discord.com/developers/components/reference#checkbox-group
 */
class CheckboxBuilder {
  private readonly data: Partial<APICheckboxComponent> = {
    type: 23,
  };

  /**
   * Sets the component custom ID.
   * @param customId - A developer-defined identifier, up to 100 characters.
   * @returns This builder for chaining.
   */
  public setCustomId(customId: string): this {
    this.data.custom_id = customId;
    return this;
  }

  /**
   * Sets whether the checkbox is selected by default.
   * @param defaultValue - Whether Discord should select the checkbox initially.
   * @returns This builder for chaining.
   */
  public setDefault(defaultValue: boolean): this {
    this.data.default = defaultValue;
    return this;
  }

  /**
   * Serializes the component into the official Discord API shape.
   * @returns The checkbox component payload.
   */
  public toJSON(): APICheckboxComponent {
    return this.data as APICheckboxComponent;
  }
}

export default CheckboxBuilder;
