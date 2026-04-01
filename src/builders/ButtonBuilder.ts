import type { APIButtonComponent, APIMessageComponentEmoji } from "discord-api-types/v10";
import { ButtonStyle } from "discord-api-types/v10";

/**
 * Builder for creating interactive button components.
 *
 * @example
 * ```typescript
 * const button = new ButtonBuilder()
 *   .setLabel('Click me!')
 *   .setId('my_button')
 *   .setStyle('Primary');
 * ```
 */
export class ButtonBuilder {
  private readonly data: Record<string, unknown> & { type: 2 };

  /**
   * Creates a new button builder
   * @param data - Initial button data
   */
  constructor(data?: Partial<APIButtonComponent>) {
    this.data = { type: 2, ...data };
  }

  /**
   * Sets the style of the button
   * @param style - The button style
   * @returns The button builder for chaining
   */
  public setStyle(style: ButtonStyle): this {
    this.data.style = style;
    return this;
  }

  /**
   * Sets the label of the button (max 80 characters)
   * @param label - The label text
   * @returns The button builder for chaining
   */
  public setLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  /**
   * Sets the custom ID of the button (max 100 characters)
   * Required for non-link buttons
   * @param customId - The custom ID
   * @returns The button builder for chaining
   */
  public setCustomId(customId: string): this {
    this.data.custom_id = customId;
    return this;
  }

  /**
   * Sets the URL of the button
   * Only for link buttons (style: Link)
   * @param url - The URL to open
   * @returns The button builder for chaining
   */
  public setURL(url: string): this {
    this.data.url = url;
    return this;
  }

  /**
   * Sets whether the button is disabled
   * @param disabled - Whether to disable the button
   * @returns The button builder for chaining
   */
  public setDisabled(disabled = true): this {
    this.data.disabled = disabled;
    return this;
  }

  /**
   * Sets the emoji of the button
   * @param emoji - The emoji name, ID, or object
   * @returns The button builder for chaining
   */
  public setEmoji(emoji: string | APIMessageComponentEmoji): this {
    if (typeof emoji === "string") {
      this.data.emoji = { name: emoji };
    } else {
      this.data.emoji = emoji;
    }
    return this;
  }

  /**
   * Sets the SKU ID for premium buttons
   * @param skuId - The SKU ID
   * @returns The button builder for chaining
   */
  public setSKUId(skuId: string): this {
    this.data.sku_id = skuId;
    return this;
  }

  /**
   * Gets the button data as a plain object
   * @returns The button component data
   */
  public toJSON(): APIButtonComponent {
    return this.data as unknown as APIButtonComponent;
  }

  /**
   * Creates a primary (blue) button
   * @returns A new primary button builder
   */
  public static primary(): ButtonBuilder {
    return new ButtonBuilder().setStyle(ButtonStyle.Primary);
  }

  /**
   * Creates a secondary (gray) button
   * @returns A new secondary button builder
   */
  public static secondary(): ButtonBuilder {
    return new ButtonBuilder().setStyle(ButtonStyle.Secondary);
  }

  /**
   * Creates a success (green) button
   * @returns A new success button builder
   */
  public static success(): ButtonBuilder {
    return new ButtonBuilder().setStyle(ButtonStyle.Success);
  }

  /**
   * Creates a danger (red) button
   * @returns A new danger button builder
   */
  public static danger(): ButtonBuilder {
    return new ButtonBuilder().setStyle(ButtonStyle.Danger);
  }

  /**
   * Creates a link button
   * @returns A new link button builder
   */
  public static link(): ButtonBuilder {
    return new ButtonBuilder().setStyle(ButtonStyle.Link);
  }

  /**
   * Creates a premium button
   * @returns A new premium button builder
   */
  public static premium(): ButtonBuilder {
    return new ButtonBuilder().setStyle(ButtonStyle.Premium);
  }
}

export default ButtonBuilder;
