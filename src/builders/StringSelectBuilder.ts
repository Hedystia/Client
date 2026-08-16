import type {
  APIMessageComponentEmoji,
  APISelectMenuOption,
  APIStringSelectComponent,
} from "discord-api-types/v10";

/**
 * Builds a Discord string select menu.
 *
 * @see https://docs.discord.com/developers/components/reference#string-select
 */
class StringSelectBuilder {
  private readonly data: Partial<APIStringSelectComponent> = {
    type: 3,
    options: [],
  };

  /**
   * Sets the select menu custom ID.
   * @param customId - A developer-defined identifier, up to 100 characters.
   * @returns This builder for chaining.
   */
  public setCustomId(customId: string): this {
    this.data.custom_id = customId;
    return this;
  }

  /**
   * Sets the placeholder shown when no value is selected.
   * @param placeholder - The placeholder text.
   * @returns This builder for chaining.
   */
  public setPlaceholder(placeholder: string): this {
    this.data.placeholder = placeholder;
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
   * Sets whether the select menu is disabled.
   * @param disabled - Whether users should be prevented from using the menu.
   * @returns This builder for chaining.
   */
  public setDisabled(disabled: boolean): this {
    this.data.disabled = disabled;
    return this;
  }

  /**
   * Sets whether a selection is required in a modal.
   * @param required - Whether the component must be completed.
   * @returns This builder for chaining.
   */
  public setRequired(required: boolean): this {
    this.data.required = required;
    return this;
  }

  /**
   * Adds one official Discord select option.
   * @param option - The option to add.
   * @returns This builder for chaining.
   */
  public addOption(option: APISelectMenuOption): this {
    this.data.options?.push(option);
    return this;
  }

  /**
   * Adds multiple official Discord select options.
   * @param options - The options to add.
   * @returns This builder for chaining.
   */
  public addOptions(...options: APISelectMenuOption[]): this {
    this.data.options?.push(...options);
    return this;
  }

  /**
   * Replaces all select options.
   * @param options - The official Discord options to use.
   * @returns This builder for chaining.
   */
  public setOptions(options: APISelectMenuOption[]): this {
    this.data.options = [...options];
    return this;
  }

  /**
   * Adds a convenience option using separate label and value arguments.
   * @param label - The text displayed to users.
   * @param value - The value returned in the interaction payload.
   * @param options - Optional description, emoji, and default-selection settings.
   * @returns This builder for chaining.
   */
  public addChoice(
    label: string,
    value: string,
    options?: {
      description?: string;
      emoji?: string | APIMessageComponentEmoji;
      default?: boolean;
    },
  ): this {
    this.data.options?.push({
      label,
      value,
      description: options?.description,
      emoji: typeof options?.emoji === "string" ? { name: options.emoji } : options?.emoji,
      default: options?.default,
    });
    return this;
  }

  /**
   * Serializes the component into the official Discord API shape.
   * @returns The string-select component payload.
   */
  public toJSON(): APIStringSelectComponent {
    return this.data as APIStringSelectComponent;
  }
}

export default StringSelectBuilder;
