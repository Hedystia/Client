type CompareFunction<V> = (a: V, b: V) => number;

export default class Cache<K, V> extends Map<K, V> {
  get size(): number {
    return super.size;
  }

  map<U>(fn: (val: V, key: K, map: Cache<K, V>) => U): U[] {
    const array: U[] = [];
    for (const [key, val] of this) {
      array.push(fn(val, key, this));
    }
    return array;
  }

  mapVal<U>(fn: (val: V, key: K, map: Cache<K, V>) => U): U[] {
    const iterator = this.values();
    return Array.from({ length: this.size }, () => {
      const { value, done } = iterator.next();
      if (done || value === undefined) {
        return undefined as unknown as U;
      }
      return fn(value, value as unknown as K, this);
    }).filter((item) => item !== undefined);
  }

  first(): V | undefined {
    if (this.size <= 0) {
      return undefined;
    }
    return this.values().next().value;
  }

  find(fn: (val: V, key: K, map: Cache<K, V>) => boolean): V | undefined {
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        return val;
      }
    }
    return undefined;
  }

  filter(fn: (val: V, key: K, map: Cache<K, V>) => boolean): Cache<K, V> {
    const result = new Cache<K, V>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        result.set(key, val);
      }
    }
    return result;
  }

  filterKey(fn: (key: K) => boolean): Cache<K, V> {
    const result = new Cache<K, V>();
    for (const [key, val] of this) {
      if (fn(key)) {
        result.set(key, val);
      }
    }
    return result;
  }

  last(): V | undefined {
    if (this.size <= 0) {
      return undefined;
    }
    return Array.from(this.values())[Array.from(this.values()).length - 1];
  }

  lastKey(): K | undefined {
    const keys = Array.from(this.keys());
    return keys[keys.length - 1];
  }

  tap(fn: (map: Cache<K, V>) => void): Cache<K, V> {
    fn(this);
    return this;
  }

  has(k: K): boolean {
    return super.has(k);
  }

  array(): V[] {
    return Array.from(this.values());
  }

  keyArray(): K[] {
    return Array.from(this.keys());
  }

  hasAll(...c: K[]): boolean {
    if (Array.isArray(c[0])) {
      return c[0].every((o) => super.has(o));
    }
    return c.every((o) => super.has(o));
  }

  hasAny(...keys: K[]): boolean {
    if (Array.isArray(keys[0])) {
      return keys[0]?.some((o) => super.has(o));
    }
    return keys?.some((o) => super.has(o));
  }

  some(fn: (val: V, key: K, map: Cache<K, V>) => boolean): boolean {
    for (const [key, val] of this.entries()) {
      if (fn(val, key, this)) {
        return true;
      }
    }
    return false;
  }

  random(): V | undefined {
    const values = Array.from(this.values());
    return values[Math.floor(Math.random() * values.length)];
  }

  remove(key: K): boolean {
    if (this.has(key)) {
      this.delete(key);
      return true;
    }
    return false;
  }

  removeByValue(fn: (val: V, key: K, map: Cache<K, V>) => boolean): void {
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        this.delete(key);
      }
    }
  }

  get(k: K): V | undefined {
    return super.get(k);
  }

  every(fn: (val: V, key: K, map: Cache<K, V>) => boolean): boolean {
    for (const [key, val] of this) {
      if (!fn(val, key, this)) {
        return false;
      }
    }
    return true;
  }

  each(fn: (val: V, key: K, map: Cache<K, V>) => void): Cache<K, V> {
    this.forEach((val, key) => fn(val, key, this));
    return this;
  }

  randomKey(): K | undefined {
    const keys = Array.from(this.keys());
    return keys[Math.floor(Math.random() * keys.length)];
  }

  equals(cache: Cache<K, V>): boolean {
    if (!cache) {
      return false;
    }
    if (this.size !== cache.size) {
      return false;
    }
    if (this === cache) {
      return true;
    }
    for (const [key, val] of this) {
      if (!cache.has(key) || val !== cache.get(key)) {
        return false;
      }
    }
    return true;
  }

  difference(cache: Cache<K, V>): K[] | string {
    if (this.size !== cache.size) {
      return `size difference by: ${Math.abs(this.size - cache.size)}`;
    }
    return Array.from(cache.keys()).filter((value) => !this.has(value));
  }

  findKey(fn: (val: V, key: K, map: Cache<K, V>) => boolean): K | undefined {
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        return key;
      }
    }
    return undefined;
  }

  sort(compareFn: CompareFunction<V> = Cache.defaultCompareFunction): Cache<K, V> {
    const entries = [...this.entries()];
    entries.sort((a, b) => compareFn(a[1], b[1]));
    super.clear();
    for (const [key, val] of entries) {
      super.set(key, val);
    }
    return this;
  }

  clear(): void {
    super.clear();
  }

  at(index = 0): V | undefined {
    const cacheArr = this.array();
    return cacheArr[index];
  }

  static defaultCompareFunction<V>(a: V, b: V): number {
    if (a === b) {
      return 0;
    }
    return a > b ? 1 : -1;
  }
}
