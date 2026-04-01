import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord-api-types/v10";

interface SlashCommandSubcommandData {
  name: string;
  description: string;
  options?: SlashCommandOptionData[];
}

interface SlashCommandSubcommandGroupData {
  name: string;
  description: string;
  options: SlashCommandSubcommandData[];
}

interface SlashCommandOptionData {
  type: ApplicationCommandOptionType;
  name: string;
  description: string;
  required?: boolean;
  choices?: { name: string; value: string | number }[];
  options?: SlashCommandOptionData[];
  channel_types?: number[];
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
  autocomplete?: boolean;
}

export interface SlashCommandOptionsOnlyBuilder {
  setName(name: string): this;
  setDescription(description: string): this;
  addStringOption(fn: (option: StringOption) => StringOption): this;
  addIntegerOption(fn: (option: IntegerOption) => IntegerOption): this;
  addNumberOption(fn: (option: NumberOption) => NumberOption): this;
  addBooleanOption(fn: (option: BooleanOption) => BooleanOption): this;
  addUserOption(fn: (option: UserOption) => UserOption): this;
  addChannelOption(fn: (option: ChannelOption) => ChannelOption): this;
  addRoleOption(fn: (option: RoleOption) => RoleOption): this;
  addMentionableOption(fn: (option: MentionableOption) => MentionableOption): this;
  addAttachmentOption(fn: (option: AttachmentOption) => AttachmentOption): this;
  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
}

export class SlashCommandBuilder {
  private readonly data: Partial<RESTPostAPIChatInputApplicationCommandsJSONBody> & {
    options?: (
      | SlashCommandOptionData
      | SlashCommandSubcommandData
      | SlashCommandSubcommandGroupData
    )[];
  } = {
    type: ApplicationCommandType.ChatInput,
  };

  /**
   * Sets the name of the command
   * @param name - The name (1-32 characters, lowercase)
   */
  public setName(name: string): this {
    if (name.length < 1 || name.length > 32) {
      throw new Error("Command name must be 1-32 characters");
    }
    if (!/^[a-z0-9_-]+$/.test(name)) {
      throw new Error("Command name must be lowercase alphanumeric");
    }
    this.data.name = name;
    return this;
  }

  /**
   * Sets the description of the command
   * @param description - The description (1-100 characters)
   */
  public setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error("Command description must be 1-100 characters");
    }
    this.data.description = description;
    return this;
  }

  /**
   * Sets the default member permissions
   * @param permissions - Permission flags
   */
  public setDefaultMemberPermissions(permissions: bigint | number): this {
    this.data.default_member_permissions = permissions.toString();
    return this;
  }

  /**
   * Sets whether the command can be used in DMs
   * @param enabled - Whether DMs are enabled
   */
  public setDMPermission(enabled: boolean): this {
    this.data.dm_permission = enabled;
    return this;
  }

  /**
   * Sets whether the command is NSFW
   * @param nsfw - Whether the command is NSFW
   */
  public setNSFW(nsfw: boolean): this {
    this.data.nsfw = nsfw;
    return this;
  }

  /**
   * Adds a string option
   */
  public addStringOption(fn: (option: StringOption) => StringOption): this {
    const option = fn(new StringOption());
    this._addOption(option.toJSON());
    return this;
  }

  /**
   * Adds an integer option
   */
  public addIntegerOption(fn: (option: IntegerOption) => IntegerOption): this {
    const option = fn(new IntegerOption());
    this._addOption(option.toJSON());
    return this;
  }

  /**
   * Adds a number option
   */
  public addNumberOption(fn: (option: NumberOption) => NumberOption): this {
    const option = fn(new NumberOption());
    this._addOption(option.toJSON());
    return this;
  }

  /**
   * Adds a boolean option
   */
  public addBooleanOption(fn: (option: BooleanOption) => BooleanOption): this {
    const option = fn(new BooleanOption());
    this._addOption(option.toJSON());
    return this;
  }

  /**
   * Adds a user option
   */
  public addUserOption(fn: (option: UserOption) => UserOption): this {
    const option = fn(new UserOption());
    this._addOption(option.toJSON());
    return this;
  }

  /**
   * Adds a channel option
   */
  public addChannelOption(fn: (option: ChannelOption) => ChannelOption): this {
    const option = fn(new ChannelOption());
    this._addOption(option.toJSON());
    return this;
  }

  /**
   * Adds a role option
   */
  public addRoleOption(fn: (option: RoleOption) => RoleOption): this {
    const option = fn(new RoleOption());
    this._addOption(option.toJSON());
    return this;
  }

  /**
   * Adds a mentionable option
   */
  public addMentionableOption(fn: (option: MentionableOption) => MentionableOption): this {
    const option = fn(new MentionableOption());
    this._addOption(option.toJSON());
    return this;
  }

  /**
   * Adds an attachment option
   */
  public addAttachmentOption(fn: (option: AttachmentOption) => AttachmentOption): this {
    const option = fn(new AttachmentOption());
    this._addOption(option.toJSON());
    return this;
  }

  /**
   * Adds a subcommand
   */
  public addSubcommand(fn: (subcommand: SubcommandBuilder) => SubcommandBuilder): this {
    const subcommand = fn(new SubcommandBuilder());
    if (!this.data.options) {
      this.data.options = [];
    }
    this.data.options.push(subcommand.toJSON());
    return this;
  }

  /**
   * Adds a subcommand group
   */
  public addSubcommandGroup(fn: (group: SubcommandGroupBuilder) => SubcommandGroupBuilder): this {
    const group = fn(new SubcommandGroupBuilder());
    if (!this.data.options) {
      this.data.options = [];
    }
    this.data.options.push(group.toJSON());
    return this;
  }

  private _addOption(option: SlashCommandOptionData): void {
    if (!this.data.options) {
      this.data.options = [];
    }
    this.data.options.push(option);
  }

  /**
   * Gets the JSON representation of the command
   */
  public toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    if (!this.data.name || !this.data.description) {
      throw new Error("Command must have a name and description");
    }
    return this.data as RESTPostAPIChatInputApplicationCommandsJSONBody;
  }
}

// Option builders
class BaseOptionBuilder {
  protected readonly data: SlashCommandOptionData;

  constructor(type: ApplicationCommandOptionType) {
    this.data = { type, name: "", description: "" };
  }

  public setName(name: string): this {
    if (name.length < 1 || name.length > 32) {
      throw new Error("Option name must be 1-32 characters");
    }
    this.data.name = name;
    return this;
  }

  public setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error("Option description must be 1-100 characters");
    }
    this.data.description = description;
    return this;
  }

  public setRequired(required: boolean): this {
    this.data.required = required;
    return this;
  }

  public setAutocomplete(autocomplete: boolean): this {
    this.data.autocomplete = autocomplete;
    return this;
  }
}

export class StringOption extends BaseOptionBuilder {
  constructor() {
    super(ApplicationCommandOptionType.String);
  }

  public setMinLength(min: number): this {
    this.data.min_length = min;
    return this;
  }

  public setMaxLength(max: number): this {
    this.data.max_length = max;
    return this;
  }

  public addChoice(name: string, value: string): this {
    if (!this.data.choices) {
      this.data.choices = [];
    }
    this.data.choices.push({ name, value });
    return this;
  }

  public toJSON(): SlashCommandOptionData {
    return this.data;
  }
}

export class IntegerOption extends BaseOptionBuilder {
  constructor() {
    super(ApplicationCommandOptionType.Integer);
  }

  public setMinValue(min: number): this {
    this.data.min_value = min;
    return this;
  }

  public setMaxValue(max: number): this {
    this.data.max_value = max;
    return this;
  }

  public addChoice(name: string, value: number): this {
    if (!this.data.choices) {
      this.data.choices = [];
    }
    this.data.choices.push({ name, value });
    return this;
  }

  public toJSON(): SlashCommandOptionData {
    return this.data;
  }
}

export class NumberOption extends BaseOptionBuilder {
  constructor() {
    super(ApplicationCommandOptionType.Number);
  }

  public setMinValue(min: number): this {
    this.data.min_value = min;
    return this;
  }

  public setMaxValue(max: number): this {
    this.data.max_value = max;
    return this;
  }

  public addChoice(name: string, value: number): this {
    if (!this.data.choices) {
      this.data.choices = [];
    }
    this.data.choices.push({ name, value });
    return this;
  }

  public toJSON(): SlashCommandOptionData {
    return this.data;
  }
}

export class BooleanOption extends BaseOptionBuilder {
  constructor() {
    super(ApplicationCommandOptionType.Boolean);
  }

  public toJSON(): SlashCommandOptionData {
    return this.data;
  }
}

export class UserOption extends BaseOptionBuilder {
  constructor() {
    super(ApplicationCommandOptionType.User);
  }

  public toJSON(): SlashCommandOptionData {
    return this.data;
  }
}

export class ChannelOption extends BaseOptionBuilder {
  constructor() {
    super(ApplicationCommandOptionType.Channel);
  }

  public setChannelTypes(types: number[]): this {
    this.data.channel_types = types;
    return this;
  }

  public toJSON(): SlashCommandOptionData {
    return this.data;
  }
}

export class RoleOption extends BaseOptionBuilder {
  constructor() {
    super(ApplicationCommandOptionType.Role);
  }

  public toJSON(): SlashCommandOptionData {
    return this.data;
  }
}

export class MentionableOption extends BaseOptionBuilder {
  constructor() {
    super(ApplicationCommandOptionType.Mentionable);
  }

  public toJSON(): SlashCommandOptionData {
    return this.data;
  }
}

export class AttachmentOption extends BaseOptionBuilder {
  constructor() {
    super(ApplicationCommandOptionType.Attachment);
  }

  public toJSON(): SlashCommandOptionData {
    return this.data;
  }
}

export class SubcommandBuilder {
  private readonly data: SlashCommandSubcommandData = {
    name: "",
    description: "",
    options: [],
  };

  public setName(name: string): this {
    if (name.length < 1 || name.length > 32) {
      throw new Error("Subcommand name must be 1-32 characters");
    }
    this.data.name = name;
    return this;
  }

  public setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error("Subcommand description must be 1-100 characters");
    }
    this.data.description = description;
    return this;
  }

  public addStringOption(fn: (option: StringOption) => StringOption): this {
    const option = fn(new StringOption());
    this.data.options?.push(option.toJSON());
    return this;
  }

  public addIntegerOption(fn: (option: IntegerOption) => IntegerOption): this {
    const option = fn(new IntegerOption());
    this.data.options?.push(option.toJSON());
    return this;
  }

  public addNumberOption(fn: (option: NumberOption) => NumberOption): this {
    const option = fn(new NumberOption());
    this.data.options?.push(option.toJSON());
    return this;
  }

  public addBooleanOption(fn: (option: BooleanOption) => BooleanOption): this {
    const option = fn(new BooleanOption());
    this.data.options?.push(option.toJSON());
    return this;
  }

  public addUserOption(fn: (option: UserOption) => UserOption): this {
    const option = fn(new UserOption());
    this.data.options?.push(option.toJSON());
    return this;
  }

  public addChannelOption(fn: (option: ChannelOption) => ChannelOption): this {
    const option = fn(new ChannelOption());
    this.data.options?.push(option.toJSON());
    return this;
  }

  public addRoleOption(fn: (option: RoleOption) => RoleOption): this {
    const option = fn(new RoleOption());
    this.data.options?.push(option.toJSON());
    return this;
  }

  public addMentionableOption(fn: (option: MentionableOption) => MentionableOption): this {
    const option = fn(new MentionableOption());
    this.data.options?.push(option.toJSON());
    return this;
  }

  public addAttachmentOption(fn: (option: AttachmentOption) => AttachmentOption): this {
    const option = fn(new AttachmentOption());
    this.data.options?.push(option.toJSON());
    return this;
  }

  public toJSON(): SlashCommandSubcommandData {
    return this.data;
  }
}

export class SubcommandGroupBuilder {
  private readonly data: SlashCommandSubcommandGroupData = {
    name: "",
    description: "",
    options: [],
  };

  public setName(name: string): this {
    if (name.length < 1 || name.length > 32) {
      throw new Error("Subcommand group name must be 1-32 characters");
    }
    this.data.name = name;
    return this;
  }

  public setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error("Subcommand group description must be 1-100 characters");
    }
    this.data.description = description;
    return this;
  }

  public addSubcommand(fn: (subcommand: SubcommandBuilder) => SubcommandBuilder): this {
    const subcommand = fn(new SubcommandBuilder());
    this.data.options.push(subcommand.toJSON());
    return this;
  }

  public toJSON(): SlashCommandSubcommandGroupData {
    return this.data;
  }
}

export default SlashCommandBuilder;
