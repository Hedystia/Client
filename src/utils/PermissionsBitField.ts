import { PermissionFlagsBits, type Permissions } from "discord-api-types/v10";

/**
 * Values accepted by {@link PermissionsBitField}.
 */
export type PermissionResolvable =
  | bigint
  | number
  | keyof typeof PermissionFlagsBits
  | PermissionsBitField
  | readonly PermissionResolvable[];

/**
 * A helper for working with Discord permission bitfields.
 *
 * Permission values are represented as `bigint`s because Discord permissions
 * can exceed JavaScript's safe integer range.
 *
 * @see https://docs.discord.com/developers/topics/permissions#permissions-bitwise-permission-flags
 */
export class PermissionsBitField {
  /** Official Discord permission flag constants. */
  public static readonly Flags = PermissionFlagsBits;

  /** The empty permission bitfield. */
  public static readonly Default = 0n;

  /** A bitfield containing every permission currently defined by Discord. */
  public static readonly All = Object.values(PermissionFlagsBits).reduce(
    (all, permission) => all | permission,
    0n,
  );

  /** The packed permission bits. */
  public bitfield: bigint;

  /**
   * Creates a permission bitfield.
   *
   * @param bits - Permission names, values, arrays, or another bitfield.
   */
  public constructor(bits: PermissionResolvable = PermissionsBitField.Default) {
    this.bitfield = PermissionsBitField.resolve(bits);
  }

  /**
   * Resolves a permission value to its bigint representation.
   *
   * @param bits - The value to resolve.
   * @returns The resolved permission bits.
   */
  public static resolve(bits: PermissionResolvable): bigint {
    if (bits instanceof PermissionsBitField) {
      return bits.bitfield;
    }
    if (typeof bits === "bigint") {
      return bits;
    }
    if (typeof bits === "number") {
      return BigInt(bits);
    }
    if (typeof bits === "string") {
      if (/^\d+$/.test(bits)) {
        return BigInt(bits);
      }
      const permission = PermissionFlagsBits[bits as keyof typeof PermissionFlagsBits];
      if (permission !== undefined) {
        return permission;
      }
    }
    if (Array.isArray(bits)) {
      return bits.reduce(
        (resolved, permission) => resolved | PermissionsBitField.resolve(permission),
        PermissionsBitField.Default,
      );
    }

    throw new TypeError(`Invalid permission value: ${String(bits)}`);
  }

  /**
   * Checks whether all requested permissions are present.
   *
   * @param bits - The permissions to check.
   * @param checkAdministrator - Whether Administrator should grant every permission.
   * @returns Whether all requested permissions are present.
   */
  public has(bits: PermissionResolvable, checkAdministrator = true): boolean {
    return (
      (checkAdministrator && this.hasAdministrator()) ||
      (this.bitfield & PermissionsBitField.resolve(bits)) === PermissionsBitField.resolve(bits)
    );
  }

  /**
   * Checks whether any requested permission is present.
   *
   * @param bits - The permissions to check.
   * @param checkAdministrator - Whether Administrator should grant every permission.
   * @returns Whether at least one requested permission is present.
   */
  public any(bits: PermissionResolvable, checkAdministrator = true): boolean {
    return (
      (checkAdministrator && this.hasAdministrator()) ||
      (this.bitfield & PermissionsBitField.resolve(bits)) !== PermissionsBitField.Default
    );
  }

  /**
   * Checks whether this bitfield includes Administrator.
   *
   * @returns Whether Administrator is present.
   */
  public hasAdministrator(): boolean {
    return (
      (this.bitfield & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator
    );
  }

  /**
   * Returns permission names missing from this bitfield.
   *
   * @param bits - The permissions to inspect.
   * @param checkAdministrator - Whether Administrator should satisfy every permission.
   * @returns The missing permission names.
   */
  public missing(
    bits: PermissionResolvable,
    checkAdministrator = true,
  ): Array<keyof typeof PermissionFlagsBits> {
    if (checkAdministrator && this.hasAdministrator()) {
      return [];
    }
    const requested = new PermissionsBitField(bits);
    return requested.toArray().filter((permission) => !this.has(permission, false));
  }

  /**
   * Adds permissions to this bitfield.
   *
   * @param bits - The permissions to add.
   * @returns This bitfield, or a new bitfield when frozen.
   */
  public add(...bits: PermissionResolvable[]): PermissionsBitField {
    const resolved = bits.reduce<bigint>(
      (total, permission) => total | PermissionsBitField.resolve(permission),
      PermissionsBitField.Default,
    );
    if (Object.isFrozen(this)) {
      return new PermissionsBitField(this.bitfield | resolved);
    }
    this.bitfield |= resolved;
    return this;
  }

  /**
   * Removes permissions from this bitfield.
   *
   * @param bits - The permissions to remove.
   * @returns This bitfield, or a new bitfield when frozen.
   */
  public remove(...bits: PermissionResolvable[]): PermissionsBitField {
    const resolved = bits.reduce<bigint>(
      (total, permission) => total | PermissionsBitField.resolve(permission),
      PermissionsBitField.Default,
    );
    if (Object.isFrozen(this)) {
      return new PermissionsBitField(this.bitfield & ~resolved);
    }
    this.bitfield &= ~resolved;
    return this;
  }

  /**
   * Checks whether this bitfield equals another permission value.
   *
   * @param bits - The permission value to compare.
   * @returns Whether the values are equal.
   */
  public equals(bits: PermissionResolvable): boolean {
    return this.bitfield === PermissionsBitField.resolve(bits);
  }

  /**
   * Converts the bitfield to permission names.
   *
   * @param checkAdministrator - Whether Administrator should expand to every permission.
   * @returns The enabled permission names.
   */
  public toArray(checkAdministrator = true): Array<keyof typeof PermissionFlagsBits> {
    return (Object.keys(PermissionFlagsBits) as Array<keyof typeof PermissionFlagsBits>).filter(
      (permission) => this.has(permission, checkAdministrator),
    );
  }

  /**
   * Serializes permissions into a name-to-boolean object.
   *
   * @param checkAdministrator - Whether Administrator should expand to every permission.
   * @returns The serialized permission map.
   */
  public serialize(checkAdministrator = true): Record<keyof typeof PermissionFlagsBits, boolean> {
    const serialized = {} as Record<keyof typeof PermissionFlagsBits, boolean>;
    for (const permission of Object.keys(PermissionFlagsBits) as Array<
      keyof typeof PermissionFlagsBits
    >) {
      serialized[permission] = this.has(permission, checkAdministrator);
    }
    return serialized;
  }

  /**
   * Freezes this bitfield.
   *
   * @returns The frozen bitfield.
   */
  public freeze(): Readonly<this> {
    return Object.freeze(this);
  }

  /**
   * Converts this bitfield to Discord's string permission representation.
   *
   * @returns The official Discord permission string.
   */
  public toJSON(): Permissions {
    return this.bitfield.toString();
  }

  /**
   * Returns the primitive bigint value.
   *
   * @returns The packed permission bits.
   */
  public valueOf(): bigint {
    return this.bitfield;
  }

  /**
   * Iterates over enabled permission names.
   */
  public *[Symbol.iterator](): IterableIterator<keyof typeof PermissionFlagsBits> {
    yield* this.toArray();
  }
}

export default PermissionsBitField;
