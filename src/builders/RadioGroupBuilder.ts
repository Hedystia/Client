import type { APIRadioGroupComponent, APIRadioGroupOption } from "discord-api-types/v10";

/**
 * Builds a Discord radio-group component.
 *
 * @see https://docs.discord.com/developers/components/reference#radio-group
 */
class RadioGroupBuilder {
  private readonly data: Partial<APIRadioGroupComponent> = {
    type: 21,
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
   * Adds one radio option.
   * @param option - An official Discord radio-group option.
   * @returns This builder for chaining.
   */
  public addOption(option: APIRadioGroupOption): this {
    this.data.options?.push(option);
    return this;
  }

  /**
   * Adds multiple radio options.
   * @param options - Official Discord radio-group options.
   * @returns This builder for chaining.
   */
  public addOptions(...options: APIRadioGroupOption[]): this {
    this.data.options?.push(...options);
    return this;
  }

  /**
   * Replaces all radio options.
   * @param options - The official Discord radio-group options to use.
   * @returns This builder for chaining.
   */
  public setOptions(options: APIRadioGroupOption[]): this {
    this.data.options = [...options];
    return this;
  }

  /**
   * Sets whether a radio option must be selected.
   * @param required - Whether a selection is required.
   * @returns This builder for chaining.
   */
  public setRequired(required: boolean): this {
    this.data.required = required;
    return this;
  }

  /**
   * Serializes the component into the official Discord API shape.
   * @returns The radio-group component payload.
   */
  public toJSON(): APIRadioGroupComponent {
    return this.data as APIRadioGroupComponent;
  }
}

export default RadioGroupBuilder;
