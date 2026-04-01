/**
 * A Map-like collection that stores key-value pairs
 * @template K - The key type
 * @template V - The value type
 */
export class Collection<K, V> extends Map<K, V> {
  /**
   * Obtains the first value(s) in this collection
   * @param amount - Amount of values to obtain from the beginning
   * @returns A single value or array of values
   */
  public first(): V | undefined;
  public first(amount: number): V[];
  public first(amount?: number): V | V[] | undefined {
    if (amount === undefined) {
      return this.values().next().value;
    }

    if (amount < 0) {
      return [];
    }

    if (amount === 0) {
      return [];
    }

    const values = this.values();
    const result: V[] = [];

    for (let i = 0; i < amount; i++) {
      const value = values.next();
      if (value.done) {
        break;
      }
      result.push(value.value);
    }

    return result;
  }

  /**
   * Obtains the last value(s) in this collection
   * @param amount - Amount of values to obtain from the end
   * @returns A single value or array of values
   */
  public last(): V | undefined;
  public last(amount: number): V[];
  public last(amount?: number): V | V[] | undefined {
    const arr = [...this.values()];
    if (amount === undefined) {
      return arr[arr.length - 1];
    }

    if (amount < 0) {
      return [];
    }

    if (amount === 0) {
      return [];
    }

    return arr.slice(-amount);
  }

  /**
   * Obtains the first key(s) in this collection
   * @param amount - Amount of keys to obtain from the beginning
   * @returns A single key or array of keys
   */
  public firstKey(): K | undefined;
  public firstKey(amount: number): K[];
  public firstKey(amount?: number): K | K[] | undefined {
    if (amount === undefined) {
      return this.keys().next().value;
    }

    if (amount < 0) {
      return [];
    }

    if (amount === 0) {
      return [];
    }

    const keys = this.keys();
    const result: K[] = [];

    for (let i = 0; i < amount; i++) {
      const key = keys.next();
      if (key.done) {
        break;
      }
      result.push(key.value);
    }

    return result;
  }

  /**
   * Obtains the last key(s) in this collection
   * @param amount - Amount of keys to obtain from the end
   * @returns A single key or array of keys
   */
  public lastKey(): K | undefined;
  public lastKey(amount: number): K[];
  public lastKey(amount?: number): K | K[] | undefined {
    const arr = [...this.keys()];
    if (amount === undefined) {
      return arr[arr.length - 1];
    }

    if (amount < 0) {
      return [];
    }

    if (amount === 0) {
      return [];
    }

    return arr.slice(-amount);
  }

  /**
   * Identical to Array.prototype.at().
   * Returns the item at a given index, allowing for positive and negative integers.
   * @param index - The index of the element to obtain
   * @returns The element at the given index
   */
  public at(index: number): V | undefined {
    const size = this.size;
    let normalizedIndex = index;
    if (normalizedIndex < 0) {
      normalizedIndex = size + normalizedIndex;
    }

    if (normalizedIndex < 0 || normalizedIndex >= size) {
      return undefined;
    }

    let i = 0;
    for (const value of this.values()) {
      if (i === normalizedIndex) {
        return value;
      }
      i++;
    }

    return undefined;
  }

  /**
   * Identical to Array.prototype.find().
   * Returns the first item that satisfies a condition.
   * @param fn - The function to test with
   * @param thisArg - The value to use as `this` when executing function
   * @returns The first matching element
   */
  public find<T extends V>(
    fn: (value: V, key: K, collection: this) => value is T,
    thisArg?: unknown,
  ): T | undefined;
  public find(
    fn: (value: V, key: K, collection: this) => boolean,
    thisArg?: unknown,
  ): V | undefined;
  public find(
    fn: (value: V, key: K, collection: this) => boolean,
    thisArg?: unknown,
  ): V | undefined {
    const boundFn = thisArg !== undefined ? fn.bind(thisArg) : fn;

    for (const [key, value] of this.entries()) {
      if (boundFn(value, key, this)) {
        return value;
      }
    }

    return undefined;
  }

  /**
   * Identical to Array.prototype.findIndex().
   * Returns the first key that satisfies a condition.
   * @param fn - The function to test with
   * @param thisArg - The value to use as `this` when executing function
   * @returns The first matching key
   */
  public findKey(
    fn: (value: V, key: K, collection: this) => boolean,
    thisArg?: unknown,
  ): K | undefined {
    const boundFn = thisArg !== undefined ? fn.bind(thisArg) : fn;

    for (const [key, value] of this.entries()) {
      if (boundFn(value, key, this)) {
        return key;
      }
    }

    return undefined;
  }

  /**
   * Identical to Array.prototype.filter().
   * Filters items that satisfy a condition.
   * @param fn - The function to test with
   * @param thisArg - The value to use as `this` when executing function
   * @returns A new collection of matching elements
   */
  public filter<T extends V>(
    fn: (value: V, key: K, collection: this) => value is T,
    thisArg?: unknown,
  ): Collection<K, T>;
  public filter(
    fn: (value: V, key: K, collection: this) => boolean,
    thisArg?: unknown,
  ): Collection<K, V>;
  public filter(
    fn: (value: V, key: K, collection: this) => boolean,
    thisArg?: unknown,
  ): Collection<K, V> {
    const boundFn = thisArg !== undefined ? fn.bind(thisArg) : fn;

    const results = new Collection<K, V>();

    for (const [key, value] of this.entries()) {
      if (boundFn(value, key, this)) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * Identical to Array.prototype.map().
   * Maps each item to a new value.
   * @param fn - The function to test with
   * @param thisArg - The value to use as `this` when executing function
   * @returns A new array of mapped values
   */
  public map<T>(fn: (value: V, key: K, collection: this) => T, thisArg?: unknown): T[] {
    const boundFn = thisArg !== undefined ? fn.bind(thisArg) : fn;

    const results: T[] = [];

    for (const [key, value] of this.entries()) {
      results.push(boundFn(value, key, this));
    }

    return results;
  }

  /**
   * Identical to Array.prototype.some().
   * Checks if any item satisfies a condition.
   * @param fn - The function to test with
   * @param thisArg - The value to use as `this` when executing function
   * @returns Whether any item passes the test
   */
  public some(fn: (value: V, key: K, collection: this) => boolean, thisArg?: unknown): boolean {
    const boundFn = thisArg !== undefined ? fn.bind(thisArg) : fn;

    for (const [key, value] of this.entries()) {
      if (boundFn(value, key, this)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Identical to Array.prototype.every().
   * Checks if all items satisfy a condition.
   * @param fn - The function to test with
   * @param thisArg - The value to use as `this` when executing function
   * @returns Whether all items pass the test
   */
  public every<T extends V>(
    fn: (value: V, key: K, collection: this) => value is T,
    thisArg?: unknown,
  ): this is Collection<K, T>;
  public every(fn: (value: V, key: K, collection: this) => boolean, thisArg?: unknown): boolean;
  public every(fn: (value: V, key: K, collection: this) => boolean, thisArg?: unknown): boolean {
    const boundFn = thisArg !== undefined ? fn.bind(thisArg) : fn;

    for (const [key, value] of this.entries()) {
      if (!boundFn(value, key, this)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Identical to Array.prototype.reduce().
   * Reduces the collection to a single value.
   * @param fn - The function to test with
   * @param initialValue - The initial value to start with
   * @returns The reduced value
   */
  public reduce<T>(
    fn: (accumulator: T, value: V, key: K, collection: this) => T,
    initialValue?: T,
  ): T {
    let accumulator: T | undefined = initialValue;
    let started = initialValue !== undefined;

    for (const [key, value] of this.entries()) {
      if (started) {
        accumulator = fn(accumulator as T, value, key, this);
      } else {
        accumulator = value as unknown as T;
        started = true;
      }
    }

    if (!started || accumulator === undefined) {
      throw new TypeError("Reduce of empty collection with no initial value");
    }

    return accumulator;
  }

  /**
   * Identical to Array.prototype.forEach().
   * Iterates over each item.
   * @param fn - The function to test with
   * @param thisArg - The value to use as `this` when executing function
   */
  public forEach(fn: (value: V, key: K, collection: this) => void, thisArg?: unknown): void {
    const boundFn = thisArg !== undefined ? fn.bind(thisArg) : fn;

    for (const [key, value] of this.entries()) {
      boundFn(value, key, this);
    }
  }

  /**
   * Identical to Array.prototype.sort().
   * Sorts the collection by a compare function.
   * @param compareFunction - The function to sort with
   * @returns The sorted collection
   */
  public sort(compareFunction?: (a: V, b: V, c: K, d: K) => number): this {
    const defaultCompare: (a: V, b: V) => number = (a, b) => (a > b ? 1 : a < b ? -1 : 0);
    const sortFn = compareFunction ?? defaultCompare;

    const entries = [...this.entries()];
    entries.sort((a, b) => sortFn(a[1], b[1], a[0], b[0]));

    super.clear();
    for (const [key, value] of entries) {
      super.set(key, value);
    }

    return this;
  }

  /**
   * Creates a shallow clone of the collection
   * @returns A new collection with the same entries
   */
  public clone(): Collection<K, V> {
    return new Collection<K, V>([...this.entries()]);
  }

  /**
   * Obtains a random value from the collection
   * @returns A random value or undefined if collection is empty
   */
  public random(): V | undefined {
    const size = this.size;
    if (size === 0) {
      return undefined;
    }

    const index = Math.floor(Math.random() * size);
    return this.at(index);
  }

  /**
   * Obtains a random key from the collection
   * @returns A random key or undefined if collection is empty
   */
  public randomKey(): K | undefined {
    const size = this.size;
    if (size === 0) {
      return undefined;
    }

    const index = Math.floor(Math.random() * size);
    const keys = [...this.keys()];
    return keys[index];
  }

  /**
   * Checks if this collection equals another collection
   * @param other - The other collection to compare with
   * @param fn - Optional function to compare values
   * @returns Whether the collections are equal
   */
  public equals(other: Collection<K, V>, fn?: (a: V, b: V) => boolean): boolean {
    if (this === other) {
      return true;
    }

    if (this.size !== other.size) {
      return false;
    }

    for (const [key, value] of this.entries()) {
      const otherValue = other.get(key);
      if (otherValue === undefined) {
        return false;
      }

      if (fn !== undefined) {
        if (!fn(value, otherValue)) {
          return false;
        }
      } else if (value !== otherValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns a string representation of the collection
   * @returns A string representation
   */
  public toString(): string {
    return `Collection(${this.size})`;
  }

  /**
   * Creates a new collection from an iterable
   * @param iter - The iterable to create the collection from
   * @returns A new collection
   */
  public static create<K, V>(iter: Iterable<readonly [K, V]>): Collection<K, V> {
    return new Collection([...iter]);
  }

  /**
   * Partitions the collection into two collections based on a condition
   * @param fn - The function to test with
   * @returns A tuple of [matching, nonMatching] collections
   */
  public partition(
    fn: (value: V, key: K, collection: this) => boolean,
  ): [Collection<K, V>, Collection<K, V>] {
    const matching = new Collection<K, V>();
    const nonMatching = new Collection<K, V>();

    for (const [key, value] of this.entries()) {
      if (fn(value, key, this)) {
        matching.set(key, value);
      } else {
        nonMatching.set(key, value);
      }
    }

    return [matching, nonMatching];
  }

  /**
   * Combines this collection with another collection
   * @param other - The other collection to combine with
   * @param fn - Function to combine values (defaults to using other's value)
   * @returns A new combined collection
   */
  public combine<T, R = V | T>(
    other: Collection<K, T>,
    fn?: (thisValue: V, otherValue: T, key: K) => R,
  ): Collection<K, R> {
    const result = new Collection<K, R>();
    const combineFn = fn ?? ((_a, b) => b as unknown as R);

    for (const [key, value] of this.entries()) {
      const otherValue = other.get(key);
      if (otherValue !== undefined) {
        result.set(key, combineFn(value, otherValue, key));
      } else {
        result.set(key, value as unknown as R);
      }
    }

    for (const [key, value] of other.entries()) {
      if (!this.has(key)) {
        result.set(key, value as unknown as R);
      }
    }

    return result;
  }

  /**
   * Sorts the collection by a compare function and returns a new collection
   * @param compareFunction - The function to sort with
   * @returns A new sorted collection
   */
  public sorted(compareFunction?: (a: V, b: V, c: K, d: K) => number): Collection<K, V> {
    return this.clone().sort(compareFunction);
  }

  /**
   * Reverses the collection and returns a new collection
   * @returns A new reversed collection
   */
  public reversed(): Collection<K, V> {
    const arr = [...this.entries()];
    return new Collection(arr.reverse());
  }

  /**
   * Maps the collection into a new collection
   * @param fn - The function to map with
   * @param thisArg - The value to use as `this` when executing function
   * @returns A new collection of mapped values
   */
  public mapCollection<T>(
    fn: (value: V, key: K, collection: this) => [K, T],
    thisArg?: unknown,
  ): Collection<K, T> {
    const boundFn = thisArg !== undefined ? fn.bind(thisArg) : fn;

    const results = new Collection<K, T>();

    for (const [key, value] of this.entries()) {
      const [newKey, newValue] = boundFn(value, key, this);
      results.set(newKey, newValue);
    }

    return results;
  }

  /**
   * Filters the collection into a new collection
   * @param fn - The function to filter with
   * @param thisArg - The value to use as `this` when executing function
   * @returns A new collection of filtered values
   */
  public filterCollection(
    fn: (value: V, key: K, collection: this) => boolean,
    thisArg?: unknown,
  ): Collection<K, V> {
    const boundFn = thisArg !== undefined ? fn.bind(thisArg) : fn;

    const results = new Collection<K, V>();

    for (const [key, value] of this.entries()) {
      if (boundFn(value, key, this)) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * Returns the first N elements from the collection
   * @param n - The number of elements to take
   * @returns A new collection with the first N elements
   */
  public take(n: number): Collection<K, V> {
    if (n >= this.size) {
      return this.clone();
    }

    const results = new Collection<K, V>();
    let i = 0;

    for (const [key, value] of this.entries()) {
      if (i >= n) {
        break;
      }
      results.set(key, value);
      i++;
    }

    return results;
  }

  /**
   * Returns the last N elements from the collection
   * @param n - The number of elements to take
   * @returns A new collection with the last N elements
   */
  public takeLast(n: number): Collection<K, V> {
    if (n >= this.size) {
      return this.clone();
    }

    const arr = [...this.entries()];
    return new Collection(arr.slice(-n));
  }

  /**
   * Returns a new collection excluding the first N elements
   * @param n - The number of elements to drop
   * @returns A new collection without the first N elements
   */
  public drop(n: number): Collection<K, V> {
    if (n >= this.size) {
      return new Collection();
    }

    const arr = [...this.entries()];
    return new Collection(arr.slice(n));
  }

  /**
   * Returns a new collection excluding the last N elements
   * @param n - The number of elements to drop
   * @returns A new collection without the last N elements
   */
  public dropLast(n: number): Collection<K, V> {
    if (n >= this.size) {
      return new Collection();
    }

    const arr = [...this.entries()];
    return new Collection(arr.slice(0, -n));
  }

  /**
   * Checks if the collection is empty
   * @returns Whether the collection is empty
   */
  public isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Returns the difference between this collection and another
   * @param other - The other collection to compare with
   * @returns A new collection with items only in this collection
   */
  public difference(other: Collection<K, V>): Collection<K, V> {
    const result = new Collection<K, V>();

    for (const [key, value] of this.entries()) {
      if (!other.has(key)) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * Returns the intersection of this collection and another
   * @param other - The other collection to intersect with
   * @returns A new collection with items in both collections
   */
  public intersection(other: Collection<K, V>): Collection<K, V> {
    const result = new Collection<K, V>();

    for (const [key, value] of this.entries()) {
      if (other.has(key)) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * Returns the union of this collection and another
   * @param other - The other collection to union with
   * @returns A new collection with all unique items
   */
  public union(other: Collection<K, V>): Collection<K, V> {
    const result = new Collection<K, V>([...this.entries()]);

    for (const [key, value] of other.entries()) {
      if (!result.has(key)) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * Returns the symmetric difference between this collection and another
   * @param other - The other collection to compare with
   * @returns A new collection with items in either collection but not both
   */
  public symmetricDifference(other: Collection<K, V>): Collection<K, V> {
    const result = new Collection<K, V>();

    for (const [key, value] of this.entries()) {
      if (!other.has(key)) {
        result.set(key, value);
      }
    }

    for (const [key, value] of other.entries()) {
      if (!this.has(key)) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * Merges this collection with another, using a merge function for conflicts
   * @param other - The other collection to merge with
   * @param mergeFunction - Function to resolve conflicts (defaults to using other's value)
   * @returns A new merged collection
   */
  public merge(
    other: Collection<K, V>,
    mergeFunction?: (thisValue: V, otherValue: V, key: K) => V,
  ): Collection<K, V> {
    const result = new Collection<K, V>();
    const mergeFn = mergeFunction ?? ((_, b) => b);

    for (const [key, value] of this.entries()) {
      const otherValue = other.get(key);
      if (otherValue !== undefined) {
        result.set(key, mergeFn(value, otherValue, key));
      } else {
        result.set(key, value);
      }
    }

    for (const [key, value] of other.entries()) {
      if (!this.has(key)) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * Flattens the collection by one level
   * @returns A new flattened collection
   */
  public flat<T>(): Collection<K, T> {
    const result = new Collection<K, T>();

    for (const [key, value] of this.entries()) {
      if (value instanceof Collection) {
        for (const [subKey, subValue] of (value as Collection<K, T>).entries()) {
          result.set(subKey, subValue);
        }
      } else {
        result.set(key, value as unknown as T);
      }
    }

    return result;
  }

  /**
   * Returns a new collection with all falsey values removed
   * @returns A new collection with truthy values only
   */
  public compact(): Collection<K, V> {
    const result = new Collection<K, V>();

    for (const [key, value] of this.entries()) {
      if (value) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * Returns the sum of all values in the collection
   * @param fn - Function to extract numeric value (defaults to identity)
   * @returns The sum of all values
   */
  public sum(fn?: (value: V, key: K) => number): number {
    const extractFn = fn ?? ((v: V) => (typeof v === "number" ? v : 0));
    let sum = 0;

    for (const [key, value] of this.entries()) {
      sum += extractFn(value, key);
    }

    return sum;
  }

  /**
   * Returns the average of all values in the collection
   * @param fn - Function to extract numeric value (defaults to identity)
   * @returns The average of all values
   */
  public average(fn?: (value: V, key: K) => number): number {
    if (this.size === 0) {
      return 0;
    }
    return this.sum(fn) / this.size;
  }

  /**
   * Returns the minimum value in the collection
   * @param fn - Function to extract numeric value (defaults to identity)
   * @returns The minimum value or undefined if empty
   */
  public min(fn?: (value: V, key: K) => number): V | undefined {
    if (this.size === 0) {
      return undefined;
    }

    const extractFn = fn ?? ((v: V) => (typeof v === "number" ? v : 0));
    let min: V | undefined;
    let minValue = Number.POSITIVE_INFINITY;

    for (const [key, value] of this.entries()) {
      const numValue = extractFn(value, key);
      if (numValue < minValue) {
        minValue = numValue;
        min = value;
      }
    }

    return min;
  }

  /**
   * Returns the maximum value in the collection
   * @param fn - Function to extract numeric value (defaults to identity)
   * @returns The maximum value or undefined if empty
   */
  public max(fn?: (value: V, key: K) => number): V | undefined {
    if (this.size === 0) {
      return undefined;
    }

    const extractFn = fn ?? ((v: V) => (typeof v === "number" ? v : 0));
    let max: V | undefined;
    let maxValue = Number.NEGATIVE_INFINITY;

    for (const [key, value] of this.entries()) {
      const numValue = extractFn(value, key);
      if (numValue > maxValue) {
        maxValue = numValue;
        max = value;
      }
    }

    return max;
  }
}

export default Collection;
