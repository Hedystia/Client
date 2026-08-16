import type { APICheckboxGroupComponent, APICheckboxGroupOption } from "discord-api-types/v10";

/**
 * Builds a Discord checkbox-group component.
 *
 * @see https://docs.discord.com/developers/components/reference#checkbox-group
 */
class CheckboxGroupBuilder {
  private readonly data: Partial<APICheckboxGroupComponent> = {
    type: 22,
    options: [],
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
   * Adds one checkbox option.
   * @param option - An official Discord checkbox-group option.
   * @returns This builder for chaining.
   */
  public addOption(option: APICheckboxGroupOption): this {
    this.data.options?.push(option);
    return this;
  }

  /**
   * Adds multiple checkbox options.
   * @param options - Official Discord checkbox-group options.
   * @returns This builder for chaining.
   */
  public addOptions(...options: APICheckboxGroupOption[]): this {
    this.data.options?.push(...options);
    return this;
  }

  /**
   * Replaces all checkbox options.
   * @param options - The official Discord checkbox-group options to use.
   * @returns This builder for chaining.
   */
  public setOptions(options: APICheckboxGroupOption[]): this {
    this.data.options = [...options];
    return this;
  }

  /**
   * Sets the minimum number of values that may be selected.
   * @param minValues - The minimum selection count.
   * @returns This builder for chaining.
   */
  public setMinValues(minValues: number): this {
    this.data.min_values = minValues;
    return this;
  }

  /**
   * Sets the maximum number of values that may be selected.
   * @param maxValues - The maximum selection count.
   * @returns This builder for chaining.
   */
  public setMaxValues(maxValues: number): this {
    this.data.max_values = maxValues;
    return this;
  }

  /**
   * Sets whether the component must be completed.
   * @param required - Whether a selection is required.
   * @returns This builder for chaining.
   */
  public setRequired(required: boolean): this {
    this.data.required = required;
    return this;
  }

  /**
   * Serializes the component into the official Discord API shape.
   * @returns The checkbox-group component payload.
   */
  public toJSON(): APICheckboxGroupComponent {
    return this.data as APICheckboxGroupComponent;
  }
}

export default CheckboxGroupBuilder;
