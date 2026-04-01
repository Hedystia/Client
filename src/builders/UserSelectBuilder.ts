import type { APIUserSelectComponent } from "discord-api-types/v10";
import { SelectMenuDefaultValueType } from "discord-api-types/v10";

class UserSelectBuilder {
  private readonly data: Partial<APIUserSelectComponent> = {
    type: 5, // ComponentType.UserSelect
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
   * Sets the minimum number of users that must be selected (0-25)
   * @param minValues - The minimum number of selections
   * @returns The current builder
   */
  public setMinValues(minValues: number): this {
    this.data.min_values = minValues;
    return this;
  }

  /**
   * Sets the maximum number of users that can be selected (1-25)
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
   * Sets default users to be selected
   * @param userIds - Array of user IDs to select by default
   * @returns The current builder
   */
  public setDefaultValues(userIds: string[]): this {
    this.data.default_values = userIds.map((id) => ({
      type: SelectMenuDefaultValueType.User,
      id,
    }));
    return this;
  }

  /**
   * Gets the built user select component
   * @returns The user select component data
   */
  public toJSON(): APIUserSelectComponent {
    return this.data as APIUserSelectComponent;
  }
}

export default UserSelectBuilder;
