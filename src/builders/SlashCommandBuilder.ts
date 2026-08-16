import {
  type APIApplicationCommandAttachmentOption,
  type APIApplicationCommandBasicOption,
  type APIApplicationCommandBooleanOption,
  type APIApplicationCommandChannelOption,
  type APIApplicationCommandIntegerOption,
  type APIApplicationCommandMentionableOption,
  type APIApplicationCommandNumberOption,
  type APIApplicationCommandOption,
  type APIApplicationCommandOptionChoice,
  type APIApplicationCommandRoleOption,
  type APIApplicationCommandStringOption,
  type APIApplicationCommandSubcommandGroupOption,
  type APIApplicationCommandSubcommandOption,
  type APIApplicationCommandUserOption,
  type ApplicationCommandOptionAllowedChannelType,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type FileUploadType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord-api-types/v10";

type CommandOption = APIApplicationCommandOption;
type BasicOption = APIApplicationCommandBasicOption;

/**
 * Common builder methods for a slash-command option.
 */
export interface SlashCommandOptionBuilder<T extends BasicOption = BasicOption> {
  /**
   * Sets the option name.
   * @param name - The option name, between 1 and 32 characters.
   * @returns The option builder for chaining.
   */
  setName(name: string): this;
  /**
   * Sets the option description.
   * @param description - The option description, between 1 and 100 characters.
   * @returns The option builder for chaining.
   */
  setDescription(description: string): this;
  /**
   * Marks the option as required.
   * @param required - Whether the option must be supplied.
   * @returns The option builder for chaining.
   */
  setRequired(required: boolean): this;
  /**
   * Serializes the option into the official Discord API shape.
   * @returns The application-command option.
   */
  toJSON(): T;
}

/**
 * Common builder methods available while constructing a slash command.
 */
export interface SlashCommandOptionsOnlyBuilder {
  /**
   * Sets the command name.
   * @param name - The command name, between 1 and 32 lowercase characters.
   * @returns The command builder for chaining.
   */
  setName(name: string): this;
  /**
   * Sets the command description.
   * @param description - The command description, between 1 and 100 characters.
   * @returns The command builder for chaining.
   */
  setDescription(description: string): this;
  /**
   * Adds a string option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  addStringOption(fn: (option: StringOption) => StringOption): this;
  /**
   * Adds an integer option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  addIntegerOption(fn: (option: IntegerOption) => IntegerOption): this;
  /**
   * Adds a number option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  addNumberOption(fn: (option: NumberOption) => NumberOption): this;
  /**
   * Adds a boolean option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  addBooleanOption(fn: (option: BooleanOption) => BooleanOption): this;
  /**
   * Adds a user option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  addUserOption(fn: (option: UserOption) => UserOption): this;
  /**
   * Adds a channel option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  addChannelOption(fn: (option: ChannelOption) => ChannelOption): this;
  /**
   * Adds a role option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  addRoleOption(fn: (option: RoleOption) => RoleOption): this;
  /**
   * Adds a mentionable option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  addMentionableOption(fn: (option: MentionableOption) => MentionableOption): this;
  /**
   * Adds an attachment option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  addAttachmentOption(fn: (option: AttachmentOption) => AttachmentOption): this;
  /**
   * Adds a subcommand.
   * @param fn - A function that configures the subcommand.
   * @returns The command builder for chaining.
   */
  addSubcommand(fn: (subcommand: SubcommandBuilder) => SubcommandBuilder): this;
  /**
   * Adds a subcommand group.
   * @param fn - A function that configures the subcommand group.
   * @returns The command builder for chaining.
   */
  addSubcommandGroup(fn: (group: SubcommandGroupBuilder) => SubcommandGroupBuilder): this;
  /**
   * Serializes the command into the official Discord REST body.
   * @returns The chat-input application-command body.
   */
  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
}

/**
 * Base implementation shared by all basic slash-command option builders.
 * @template T - The official Discord option type produced by the builder.
 */
class BaseOptionBuilder<T extends BasicOption> implements SlashCommandOptionBuilder<T> {
  protected readonly data: Partial<T> & Pick<T, "type" | "name" | "description">;

  /**
   * @param type - The official Discord option type.
   */
  public constructor(type: T["type"]) {
    this.data = { type, name: "", description: "" } as Partial<T> &
      Pick<T, "type" | "name" | "description">;
  }

  /**
   * Sets the option name.
   * @param name - The option name, between 1 and 32 characters.
   * @returns The option builder for chaining.
   */
  public setName(name: string): this {
    if (name.length < 1 || name.length > 32) {
      throw new Error("Option name must be 1-32 characters");
    }
    this.data.name = name;
    return this;
  }

  /**
   * Sets the option description.
   * @param description - The option description, between 1 and 100 characters.
   * @returns The option builder for chaining.
   */
  public setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error("Option description must be 1-100 characters");
    }
    this.data.description = description;
    return this;
  }

  /**
   * Marks the option as required.
   * @param required - Whether the option must be supplied.
   * @returns The option builder for chaining.
   */
  public setRequired(required: boolean): this {
    this.data.required = required;
    return this;
  }

  /**
   * Serializes the option.
   * @returns The official Discord application-command option.
   */
  public toJSON(): T {
    return this.data as T;
  }
}

/**
 * Builder for a string application-command option.
 */
export class StringOption extends BaseOptionBuilder<APIApplicationCommandStringOption> {
  public constructor() {
    super(ApplicationCommandOptionType.String);
  }

  /**
   * Enables or disables autocomplete for this string option.
   * @param autocomplete - Whether Discord should request autocomplete values.
   * @returns The option builder for chaining.
   */
  public setAutocomplete(autocomplete: boolean): this {
    this.data.autocomplete = autocomplete;
    return this;
  }

  /**
   * Sets the minimum string length.
   * @param min - The minimum length accepted by Discord.
   * @returns The option builder for chaining.
   */
  public setMinLength(min: number): this {
    this.data.min_length = min;
    return this;
  }

  /**
   * Sets the maximum string length.
   * @param max - The maximum length accepted by Discord.
   * @returns The option builder for chaining.
   */
  public setMaxLength(max: number): this {
    this.data.max_length = max;
    return this;
  }

  /**
   * Adds a string choice.
   * @param name - The choice name.
   * @param value - The value submitted to Discord.
   * @returns The option builder for chaining.
   */
  public addChoice(name: string, value: string): this {
    const choices = (this.data.choices ?? []) as APIApplicationCommandOptionChoice<string>[];
    choices.push({ name, value });
    this.data.choices = choices;
    return this;
  }
}

/**
 * Builder for an integer application-command option.
 */
export class IntegerOption extends BaseOptionBuilder<APIApplicationCommandIntegerOption> {
  public constructor() {
    super(ApplicationCommandOptionType.Integer);
  }

  /**
   * Enables or disables autocomplete for this integer option.
   * @param autocomplete - Whether Discord should request autocomplete values.
   * @returns The option builder for chaining.
   */
  public setAutocomplete(autocomplete: boolean): this {
    this.data.autocomplete = autocomplete;
    return this;
  }

  /**
   * Sets the minimum integer value.
   * @param min - The minimum value accepted by Discord.
   * @returns The option builder for chaining.
   */
  public setMinValue(min: number): this {
    this.data.min_value = min;
    return this;
  }

  /**
   * Sets the maximum integer value.
   * @param max - The maximum value accepted by Discord.
   * @returns The option builder for chaining.
   */
  public setMaxValue(max: number): this {
    this.data.max_value = max;
    return this;
  }

  /**
   * Adds an integer choice.
   * @param name - The choice name.
   * @param value - The value submitted to Discord.
   * @returns The option builder for chaining.
   */
  public addChoice(name: string, value: number): this {
    const choices = (this.data.choices ?? []) as APIApplicationCommandOptionChoice<number>[];
    choices.push({ name, value });
    this.data.choices = choices;
    return this;
  }
}

/**
 * Builder for a number application-command option.
 */
export class NumberOption extends BaseOptionBuilder<APIApplicationCommandNumberOption> {
  public constructor() {
    super(ApplicationCommandOptionType.Number);
  }

  /**
   * Enables or disables autocomplete for this number option.
   * @param autocomplete - Whether Discord should request autocomplete values.
   * @returns The option builder for chaining.
   */
  public setAutocomplete(autocomplete: boolean): this {
    this.data.autocomplete = autocomplete;
    return this;
  }

  /**
   * Sets the minimum numeric value.
   * @param min - The minimum value accepted by Discord.
   * @returns The option builder for chaining.
   */
  public setMinValue(min: number): this {
    this.data.min_value = min;
    return this;
  }

  /**
   * Sets the maximum numeric value.
   * @param max - The maximum value accepted by Discord.
   * @returns The option builder for chaining.
   */
  public setMaxValue(max: number): this {
    this.data.max_value = max;
    return this;
  }

  /**
   * Adds a numeric choice.
   * @param name - The choice name.
   * @param value - The value submitted to Discord.
   * @returns The option builder for chaining.
   */
  public addChoice(name: string, value: number): this {
    const choices = (this.data.choices ?? []) as APIApplicationCommandOptionChoice<number>[];
    choices.push({ name, value });
    this.data.choices = choices;
    return this;
  }
}

/**
 * Builder for a boolean application-command option.
 */
export class BooleanOption extends BaseOptionBuilder<APIApplicationCommandBooleanOption> {
  public constructor() {
    super(ApplicationCommandOptionType.Boolean);
  }
}

/**
 * Builder for a user application-command option.
 */
export class UserOption extends BaseOptionBuilder<APIApplicationCommandUserOption> {
  public constructor() {
    super(ApplicationCommandOptionType.User);
  }
}

/**
 * Builder for a channel application-command option.
 */
export class ChannelOption extends BaseOptionBuilder<APIApplicationCommandChannelOption> {
  public constructor() {
    super(ApplicationCommandOptionType.Channel);
  }

  /**
   * Restricts the option to specific channel types.
   * @param types - The official Discord channel types allowed by the option.
   * @returns The option builder for chaining.
   */
  public setChannelTypes(types: ApplicationCommandOptionAllowedChannelType[]): this {
    this.data.channel_types = types;
    return this;
  }
}

/**
 * Builder for a role application-command option.
 */
export class RoleOption extends BaseOptionBuilder<APIApplicationCommandRoleOption> {
  public constructor() {
    super(ApplicationCommandOptionType.Role);
  }
}

/**
 * Builder for a mentionable application-command option.
 */
export class MentionableOption extends BaseOptionBuilder<APIApplicationCommandMentionableOption> {
  public constructor() {
    super(ApplicationCommandOptionType.Mentionable);
  }
}

/**
 * Builder for an attachment application-command option.
 */
export class AttachmentOption extends BaseOptionBuilder<APIApplicationCommandAttachmentOption> {
  public constructor() {
    super(ApplicationCommandOptionType.Attachment);
  }

  /**
   * Sets the allowed file types.
   * @param fileTypes - MIME categories or file extensions supported by Discord.
   * @returns The option builder for chaining.
   */
  public setFileTypes(fileTypes: FileUploadType[]): this {
    this.data.file_types = [...fileTypes];
    return this;
  }

  /**
   * Adds allowed file types.
   * @param fileTypes - MIME categories or file extensions supported by Discord.
   * @returns The option builder for chaining.
   */
  public addFileTypes(...fileTypes: FileUploadType[]): this {
    this.data.file_types = [...(this.data.file_types ?? []), ...fileTypes];
    return this;
  }
}

/**
 * Builder for a slash-command subcommand.
 */
export class SubcommandBuilder {
  private readonly data: APIApplicationCommandSubcommandOption = {
    type: ApplicationCommandOptionType.Subcommand,
    name: "",
    description: "",
    options: [],
  };

  /**
   * Sets the subcommand name.
   * @param name - The subcommand name, between 1 and 32 characters.
   * @returns The subcommand builder for chaining.
   */
  public setName(name: string): this {
    if (name.length < 1 || name.length > 32) {
      throw new Error("Subcommand name must be 1-32 characters");
    }
    this.data.name = name;
    return this;
  }

  /**
   * Sets the subcommand description.
   * @param description - The subcommand description, between 1 and 100 characters.
   * @returns The subcommand builder for chaining.
   */
  public setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error("Subcommand description must be 1-100 characters");
    }
    this.data.description = description;
    return this;
  }

  /**
   * Adds a basic option to the subcommand.
   * @param option - The option builder to add.
   * @returns The subcommand builder for chaining.
   */
  public addOption(option: SlashCommandOptionBuilder<BasicOption>): this {
    this.data.options?.push(option.toJSON());
    return this;
  }

  /**
   * Adds a string option to the subcommand.
   * @param fn - A function that configures the option.
   * @returns The subcommand builder for chaining.
   */
  public addStringOption(fn: (option: StringOption) => StringOption): this {
    return this.addOption(fn(new StringOption()));
  }

  /**
   * Adds an integer option to the subcommand.
   * @param fn - A function that configures the option.
   * @returns The subcommand builder for chaining.
   */
  public addIntegerOption(fn: (option: IntegerOption) => IntegerOption): this {
    return this.addOption(fn(new IntegerOption()));
  }

  /**
   * Adds a number option to the subcommand.
   * @param fn - A function that configures the option.
   * @returns The subcommand builder for chaining.
   */
  public addNumberOption(fn: (option: NumberOption) => NumberOption): this {
    return this.addOption(fn(new NumberOption()));
  }

  /**
   * Adds a boolean option to the subcommand.
   * @param fn - A function that configures the option.
   * @returns The subcommand builder for chaining.
   */
  public addBooleanOption(fn: (option: BooleanOption) => BooleanOption): this {
    return this.addOption(fn(new BooleanOption()));
  }

  /**
   * Adds a user option to the subcommand.
   * @param fn - A function that configures the option.
   * @returns The subcommand builder for chaining.
   */
  public addUserOption(fn: (option: UserOption) => UserOption): this {
    return this.addOption(fn(new UserOption()));
  }

  /**
   * Adds a channel option to the subcommand.
   * @param fn - A function that configures the option.
   * @returns The subcommand builder for chaining.
   */
  public addChannelOption(fn: (option: ChannelOption) => ChannelOption): this {
    return this.addOption(fn(new ChannelOption()));
  }

  /**
   * Adds a role option to the subcommand.
   * @param fn - A function that configures the option.
   * @returns The subcommand builder for chaining.
   */
  public addRoleOption(fn: (option: RoleOption) => RoleOption): this {
    return this.addOption(fn(new RoleOption()));
  }

  /**
   * Adds a mentionable option to the subcommand.
   * @param fn - A function that configures the option.
   * @returns The subcommand builder for chaining.
   */
  public addMentionableOption(fn: (option: MentionableOption) => MentionableOption): this {
    return this.addOption(fn(new MentionableOption()));
  }

  /**
   * Adds an attachment option to the subcommand.
   * @param fn - A function that configures the option.
   * @returns The subcommand builder for chaining.
   */
  public addAttachmentOption(fn: (option: AttachmentOption) => AttachmentOption): this {
    return this.addOption(fn(new AttachmentOption()));
  }

  /**
   * Serializes the subcommand.
   * @returns The official Discord subcommand option.
   */
  public toJSON(): APIApplicationCommandSubcommandOption {
    return this.data;
  }
}

/**
 * Builder for a slash-command subcommand group.
 */
export class SubcommandGroupBuilder {
  private readonly data: APIApplicationCommandSubcommandGroupOption = {
    type: ApplicationCommandOptionType.SubcommandGroup,
    name: "",
    description: "",
    options: [],
  };

  /**
   * Sets the group name.
   * @param name - The group name, between 1 and 32 characters.
   * @returns The group builder for chaining.
   */
  public setName(name: string): this {
    if (name.length < 1 || name.length > 32) {
      throw new Error("Subcommand group name must be 1-32 characters");
    }
    this.data.name = name;
    return this;
  }

  /**
   * Sets the group description.
   * @param description - The group description, between 1 and 100 characters.
   * @returns The group builder for chaining.
   */
  public setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error("Subcommand group description must be 1-100 characters");
    }
    this.data.description = description;
    return this;
  }

  /**
   * Adds a subcommand to the group.
   * @param fn - A function that configures the subcommand.
   * @returns The group builder for chaining.
   */
  public addSubcommand(fn: (subcommand: SubcommandBuilder) => SubcommandBuilder): this {
    this.data.options?.push(fn(new SubcommandBuilder()).toJSON());
    return this;
  }

  /**
   * Serializes the subcommand group.
   * @returns The official Discord subcommand-group option.
   */
  public toJSON(): APIApplicationCommandSubcommandGroupOption {
    return this.data;
  }
}

/**
 * Builder for Discord chat-input application commands.
 *
 * @see https://discord.com/developers/docs/interactions/application-commands
 */
export class SlashCommandBuilder implements SlashCommandOptionsOnlyBuilder {
  private readonly data: Partial<RESTPostAPIChatInputApplicationCommandsJSONBody> & {
    options?: CommandOption[];
  } = {
    type: ApplicationCommandType.ChatInput,
  };

  /**
   * Sets the command name.
   * @param name - The command name, between 1 and 32 lowercase characters.
   * @returns The command builder for chaining.
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
   * Sets the command description.
   * @param description - The command description, between 1 and 100 characters.
   * @returns The command builder for chaining.
   */
  public setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error("Command description must be 1-100 characters");
    }
    this.data.description = description;
    return this;
  }

  /**
   * Sets the default member permissions.
   * @param permissions - The permission bitfield represented as a number or bigint.
   * @returns The command builder for chaining.
   */
  public setDefaultMemberPermissions(permissions: bigint | number): this {
    this.data.default_member_permissions = permissions.toString();
    return this;
  }

  /**
   * Sets whether the command can be used in direct messages.
   * @param enabled - Whether direct-message usage is enabled.
   * @returns The command builder for chaining.
   */
  public setDMPermission(enabled: boolean): this {
    this.data.dm_permission = enabled;
    return this;
  }

  /**
   * Sets whether the command is age-restricted.
   * @param nsfw - Whether the command is NSFW.
   * @returns The command builder for chaining.
   */
  public setNSFW(nsfw: boolean): this {
    this.data.nsfw = nsfw;
    return this;
  }

  /**
   * Adds a string option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  public addStringOption(fn: (option: StringOption) => StringOption): this {
    return this.addOption(fn(new StringOption()));
  }

  /**
   * Adds an integer option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  public addIntegerOption(fn: (option: IntegerOption) => IntegerOption): this {
    return this.addOption(fn(new IntegerOption()));
  }

  /**
   * Adds a number option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  public addNumberOption(fn: (option: NumberOption) => NumberOption): this {
    return this.addOption(fn(new NumberOption()));
  }

  /**
   * Adds a boolean option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  public addBooleanOption(fn: (option: BooleanOption) => BooleanOption): this {
    return this.addOption(fn(new BooleanOption()));
  }

  /**
   * Adds a user option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  public addUserOption(fn: (option: UserOption) => UserOption): this {
    return this.addOption(fn(new UserOption()));
  }

  /**
   * Adds a channel option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  public addChannelOption(fn: (option: ChannelOption) => ChannelOption): this {
    return this.addOption(fn(new ChannelOption()));
  }

  /**
   * Adds a role option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  public addRoleOption(fn: (option: RoleOption) => RoleOption): this {
    return this.addOption(fn(new RoleOption()));
  }

  /**
   * Adds a mentionable option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  public addMentionableOption(fn: (option: MentionableOption) => MentionableOption): this {
    return this.addOption(fn(new MentionableOption()));
  }

  /**
   * Adds an attachment option.
   * @param fn - A function that configures the option.
   * @returns The command builder for chaining.
   */
  public addAttachmentOption(fn: (option: AttachmentOption) => AttachmentOption): this {
    return this.addOption(fn(new AttachmentOption()));
  }

  /**
   * Adds a subcommand.
   * @param fn - A function that configures the subcommand.
   * @returns The command builder for chaining.
   */
  public addSubcommand(fn: (subcommand: SubcommandBuilder) => SubcommandBuilder): this {
    return this.addOption(fn(new SubcommandBuilder()));
  }

  /**
   * Adds a subcommand group.
   * @param fn - A function that configures the subcommand group.
   * @returns The command builder for chaining.
   */
  public addSubcommandGroup(fn: (group: SubcommandGroupBuilder) => SubcommandGroupBuilder): this {
    return this.addOption(fn(new SubcommandGroupBuilder()));
  }

  /**
   * Adds an official Discord command option.
   * @param option - The option builder to serialize and add.
   * @returns The command builder for chaining.
   */
  public addOption(option: { toJSON(): CommandOption }): this {
    this.data.options ??= [];
    this.data.options.push(option.toJSON());
    return this;
  }

  /**
   * Serializes the command into an official Discord REST body.
   * @returns The chat-input application-command body.
   */
  public toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    if (!this.data.name || !this.data.description) {
      throw new Error("Command must have a name and description");
    }
    return this.data as RESTPostAPIChatInputApplicationCommandsJSONBody;
  }
}

export default SlashCommandBuilder;
