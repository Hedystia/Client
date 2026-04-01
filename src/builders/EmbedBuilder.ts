import type {
  APIEmbed,
  APIEmbedAuthor,
  APIEmbedField,
  APIEmbedFooter,
  APIEmbedImage,
  APIEmbedThumbnail,
  APIEmbedVideo,
} from "discord-api-types/v10";

/**
 * Represents an embed builder
 */
export class EmbedBuilder {
  private readonly data: APIEmbed;

  constructor(data?: APIEmbed) {
    this.data = { ...data };
  }

  /**
   * Sets the title of the embed
   * @param title - The title to set
   * @returns The embed builder for chaining
   */
  public setTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  /**
   * Sets the description of the embed
   * @param description - The description to set
   * @returns The embed builder for chaining
   */
  public setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  /**
   * Sets the URL of the embed
   * @param url - The URL to set
   * @returns The embed builder for chaining
   */
  public setURL(url: string): this {
    this.data.url = url;
    return this;
  }

  /**
   * Sets the timestamp of the embed
   * @param timestamp - The timestamp to set (defaults to current time)
   * @returns The embed builder for chaining
   */
  public setTimestamp(timestamp?: number | string | Date): this {
    if (timestamp === undefined) {
      this.data.timestamp = new Date().toISOString();
    } else if (typeof timestamp === "number" || typeof timestamp === "string") {
      this.data.timestamp = new Date(timestamp).toISOString();
    } else {
      this.data.timestamp = timestamp.toISOString();
    }
    return this;
  }

  /**
   * Sets the color of the embed
   * @param color - The color to set (as a number or hex string)
   * @returns The embed builder for chaining
   */
  public setColor(color: number | string): this {
    if (typeof color === "string") {
      if (color.startsWith("#")) {
        this.data.color = Number.parseInt(color.slice(1), 16);
      } else {
        this.data.color = Number.parseInt(color, 16);
      }
    } else {
      this.data.color = color;
    }
    return this;
  }

  /**
   * Sets the footer of the embed
   * @param footer - The footer to set
   * @returns The embed builder for chaining
   */
  public setFooter(footer: { text: string; iconURL?: string }): this {
    this.data.footer = {
      text: footer.text,
      icon_url: footer.iconURL,
    };
    return this;
  }

  /**
   * Sets the image of the embed
   * @param url - The image URL to set
   * @returns The embed builder for chaining
   */
  public setImage(url: string): this {
    this.data.image = { url };
    return this;
  }

  /**
   * Sets the thumbnail of the embed
   * @param url - The thumbnail URL to set
   * @returns The embed builder for chaining
   */
  public setThumbnail(url: string): this {
    this.data.thumbnail = { url };
    return this;
  }

  /**
   * Sets the author of the embed
   * @param author - The author to set
   * @returns The embed builder for chaining
   */
  public setAuthor(author: { name: string; url?: string; iconURL?: string }): this {
    this.data.author = {
      name: author.name,
      url: author.url,
      icon_url: author.iconURL,
    };
    return this;
  }

  /**
   * Adds a field to the embed
   * @param field - The field to add
   * @returns The embed builder for chaining
   */
  public addField(field: { name: string; value: string; inline?: boolean }): this {
    if (!this.data.fields) {
      this.data.fields = [];
    }
    this.data.fields.push({
      name: field.name,
      value: field.value,
      inline: field.inline,
    });
    return this;
  }

  /**
   * Adds multiple fields to the embed
   * @param fields - The fields to add
   * @returns The embed builder for chaining
   */
  public addFields(...fields: Array<{ name: string; value: string; inline?: boolean }>): this {
    if (!this.data.fields) {
      this.data.fields = [];
    }
    this.data.fields.push(
      ...fields.map((field) => ({
        name: field.name,
        value: field.value,
        inline: field.inline,
      })),
    );
    return this;
  }

  /**
   * Sets the fields of the embed
   * @param fields - The fields to set
   * @returns The embed builder for chaining
   */
  public setFields(...fields: Array<{ name: string; value: string; inline?: boolean }>): this {
    this.data.fields = fields.map((field) => ({
      name: field.name,
      value: field.value,
      inline: field.inline,
    }));
    return this;
  }

  /**
   * Gets the data of the embed
   * @returns The embed data
   */
  public toJSON(): APIEmbed {
    return { ...this.data };
  }

  /**
   * Gets the title of the embed
   */
  public get title(): string | undefined {
    return this.data.title;
  }

  /**
   * Gets the description of the embed
   */
  public get description(): string | undefined {
    return this.data.description;
  }

  /**
   * Gets the URL of the embed
   */
  public get url(): string | undefined {
    return this.data.url;
  }

  /**
   * Gets the timestamp of the embed
   */
  public get timestamp(): string | undefined {
    return this.data.timestamp;
  }

  /**
   * Gets the color of the embed
   */
  public get color(): number | undefined {
    return this.data.color;
  }

  /**
   * Gets the footer of the embed
   */
  public get footer(): APIEmbedFooter | undefined {
    return this.data.footer;
  }

  /**
   * Gets the image of the embed
   */
  public get image(): APIEmbedImage | undefined {
    return this.data.image;
  }

  /**
   * Gets the thumbnail of the embed
   */
  public get thumbnail(): APIEmbedThumbnail | undefined {
    return this.data.thumbnail;
  }

  /**
   * Gets the author of the embed
   */
  public get author(): APIEmbedAuthor | undefined {
    return this.data.author;
  }

  /**
   * Gets the fields of the embed
   */
  public get fields(): APIEmbedField[] | undefined {
    return this.data.fields;
  }

  /**
   * Gets the video of the embed
   */
  public get video(): APIEmbedVideo | undefined {
    return this.data.video;
  }

  /**
   * Gets the length of the embed
   */
  public get length(): number {
    let length = 0;
    if (this.data.title) {
      length += this.data.title.length;
    }
    if (this.data.description) {
      length += this.data.description.length;
    }
    if (this.data.fields) {
      for (const field of this.data.fields) {
        length += field.name.length + field.value.length;
      }
    }
    if (this.data.footer) {
      length += this.data.footer.text.length;
    }
    if (this.data.author) {
      length += this.data.author.name.length;
    }
    return length;
  }
}

export default EmbedBuilder;
