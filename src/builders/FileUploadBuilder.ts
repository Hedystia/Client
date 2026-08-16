import type { APIFileUploadComponent, FileUploadType } from "discord-api-types/v10";

/**
 * Builds a Discord file-upload component for a modal.
 *
 * @see https://docs.discord.com/developers/components/reference#file-upload
 */
class FileUploadBuilder {
  private readonly data: Partial<APIFileUploadComponent> = {
    type: 19,
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
   * Sets the minimum number of files that may be uploaded.
   * @param minValues - The minimum file count.
   * @returns This builder for chaining.
   */
  public setMinValues(minValues: number): this {
    this.data.min_values = minValues;
    return this;
  }

  /**
   * Sets the maximum number of files that may be uploaded.
   * @param maxValues - The maximum file count.
   * @returns This builder for chaining.
   */
  public setMaxValues(maxValues: number): this {
    this.data.max_values = maxValues;
    return this;
  }

  /**
   * Replaces the allowed file types.
   * @param fileTypes - Official Discord file categories or extensions.
   * @returns This builder for chaining.
   */
  public setFileTypes(fileTypes: FileUploadType[]): this {
    this.data.file_types = [...fileTypes];
    return this;
  }

  /**
   * Adds allowed file types.
   * @param fileTypes - Official Discord file categories or extensions.
   * @returns This builder for chaining.
   */
  public addFileTypes(...fileTypes: FileUploadType[]): this {
    this.data.file_types = [...(this.data.file_types ?? []), ...fileTypes];
    return this;
  }

  /**
   * Sets whether at least one file is required.
   * @param required - Whether an upload is required.
   * @returns This builder for chaining.
   */
  public setRequired(required: boolean): this {
    this.data.required = required;
    return this;
  }

  /**
   * Serializes the component into the official Discord API shape.
   * @returns The file-upload component payload.
   */
  public toJSON(): APIFileUploadComponent {
    return this.data as APIFileUploadComponent;
  }
}

export default FileUploadBuilder;
