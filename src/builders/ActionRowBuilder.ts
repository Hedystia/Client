import type {
  APIActionRowComponent,
  APIButtonComponent,
  APIStringSelectComponent,
} from "discord-api-types/v10";
import type ButtonBuilder from "./ButtonBuilder";

type MessageComponent = APIButtonComponent | APIStringSelectComponent;

/**
 * Represents an action row builder
 */
export class ActionRowBuilder {
  private readonly data: Partial<APIActionRowComponent<MessageComponent>>;

  constructor(data?: Partial<APIActionRowComponent<MessageComponent>>) {
    this.data = { ...data };
  }

  /**
   * Adds components to the action row
   * @param components - The components to add
   * @returns The action row builder for chaining
   */
  public addComponents(...components: Array<ButtonBuilder | { toJSON(): MessageComponent }>): this {
    if (!this.data.components) {
      this.data.components = [];
    }
    this.data.components.push(...components.map((component) => component.toJSON()));
    return this;
  }

  /**
   * Sets the components of the action row
   * @param components - The components to set
   * @returns The action row builder for chaining
   */
  public setComponents(...components: Array<ButtonBuilder | { toJSON(): MessageComponent }>): this {
    this.data.components = components.map((component) => component.toJSON());
    return this;
  }

  /**
   * Gets the data of the action row
   * @returns The action row data
   */
  public toJSON(): APIActionRowComponent<MessageComponent> {
    return {
      type: 1,
      ...this.data,
    } as APIActionRowComponent<MessageComponent>;
  }

  /**
   * Creates a new action row builder
   * @returns A new action row builder
   */
  public static create(): ActionRowBuilder {
    return new ActionRowBuilder();
  }
}

export default ActionRowBuilder;
