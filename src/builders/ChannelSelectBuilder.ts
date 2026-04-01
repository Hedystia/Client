import type { APIChannelSelectComponent, ChannelType } from "discord-api-types/v10";
import { SelectMenuDefaultValueType } from "discord-api-types/v10";

class ChannelSelectBuilder {
  private readonly data: Partial<APIChannelSelectComponent> = {
    type: 8, // ComponentType.ChannelSelect
  };

  /**
   * Sets the custom ID for the select menu (max 100 characters)
   * @param customId - The custom ID
   * @returns The current builder
   */
  public setCustomId(customId: string): this {
    this.data.custom_id = customId;
    return this;
  }

  /**
   * Sets the placeholder text (max 150 characters)
   * @param placeholder - The placeholder text
   * @returns The current builder
   */
  public setPlaceholder(placeholder: string): this {
    this.data.placeholder = placeholder;
    return this;
  }

  /**
   * Sets the minimum number of channels that must be selected (0-25)
   * @param minValues - The minimum number of selections
   * @returns The current builder
   */
  public setMinValues(minValues: number): this {
    this.data.min_values = minValues;
    return this;
  }

  /**
   * Sets the maximum number of channels that can be selected (1-25)
   * @param maxValues - The maximum number of selections
   * @returns The current builder
   */
  public setMaxValues(maxValues: number): this {
    this.data.max_values = maxValues;
    return this;
  }

  /**
   * Sets whether the select menu is disabled
   * @param disabled - Whether the select menu is disabled
   * @returns The current builder
   */
  public setDisabled(disabled: boolean): this {
    this.data.disabled = disabled;
    return this;
  }

  /**
   * Sets the channel types that can be selected
   * @param channelTypes - Array of channel types to include
   * @returns The current builder
   */
  public setChannelTypes(channelTypes: ChannelType[]): this {
    this.data.channel_types = channelTypes;
    return this;
  }

  /**
   * Sets default channels to be selected
   * @param channelIds - Array of channel IDs to select by default
   * @returns The current builder
   */
  public setDefaultValues(channelIds: string[]): this {
    this.data.default_values = channelIds.map((id) => ({
      type: SelectMenuDefaultValueType.Channel,
      id,
    }));
    return this;
  }

  /**
   * Gets the built channel select component
   * @returns The channel select component data
   */
  public toJSON(): APIChannelSelectComponent {
    return this.data as APIChannelSelectComponent;
  }
}

export default ChannelSelectBuilder;
