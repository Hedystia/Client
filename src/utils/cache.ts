/**
 * Cache entry with metadata for intelligent caching
 */
interface CacheEntry<V> {
  value: V;
  createdAt: number;
  expiresAt?: number;
  lastAccessedAt: number;
  accessCount: number;
}

/**
 * Statistics about cache performance
 */
export interface CacheStats {
  /** Current number of items in cache */
  size: number;
  /** Maximum number of items allowed */
  maxSize: number;
  /** Number of expired items */
  expiredCount: number;
  /** Average age of items in milliseconds */
  avgAge: number;
  /** Age of oldest item in milliseconds */
  oldestAge: number;
  /** Age of newest item in milliseconds */
  newestAge: number;
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Hit ratio (0-1) */
  hitRatio: number;
}

/**
 * Options for cache configuration
 * @template V - The value type
 */
export interface CacheOptions<V = unknown> {
  /**
   * Maximum number of items to keep in cache
   * @defaultValue Infinity (unlimited)
   */
  maxSize?: number;

  /**
   * Default time to live for items in milliseconds
   * @defaultValue undefined (items never expire)
   */
  ttl?: number;

  /**
   * Whether to enable dynamic TTL based on usage
   * When enabled, frequently accessed items get extended TTL
   * @defaultValue false
   */
  dynamicTTL?: boolean;

  /**
   * Multiplier for dynamic TTL extension on each access
   * Only used when dynamicTTL is true
   * @defaultValue 1.1 (10% extension per access)
   */
  dynamicTTLMultiplier?: number;

  /**
   * Maximum TTL extension multiplier cap
   * Only used when dynamicTTL is true
   * @defaultValue 5 (max 5x original TTL)
   */
  dynamicTTLMaxMultiplier?: number;

  /**
   * Function to check if an item should be kept during eviction
   * Return true to keep the item, false to allow eviction
   * @param value - The cached value
   * @param key - The cache key
   * @returns Whether to keep the item
   */
  keepPredicate?: (value: V, key: unknown) => boolean;

  /**
   * Interval in milliseconds to run automatic cleanup
   * Set to 0 or false to disable automatic cleanup
   * @defaultValue 60000 (1 minute)
   */
  cleanupInterval?: number;

  /**
   * Whether the cache is enabled
   * When disabled, set/get operations are no-ops
   * @defaultValue true
   */
  enabled?: boolean;

  /**
   * Whether to track access statistics for LRU eviction
   * @defaultValue true
   */
  trackAccess?: boolean;
}

/**
 * Intelligent cache system with advanced features:
 * - TTL (Time To Live) with automatic expiration
 * - Max size with LRU (Least Recently Used) eviction
 * - Dynamic TTL based on access frequency
 * - Automatic cleanup of expired items
 * - Access tracking and statistics
 * - Per-item override options
 *
 * @template K - The key type
 * @template V - The value type
 *
 * @example
 * ```typescript
 * // Basic cache with TTL
 * const cache = new Cache({ ttl: 300000, maxSize: 100 });
 * cache.set('key', 'value');
 * const value = cache.get('key');
 * ```
 *
 * @example
 * ```typescript
 * // Cache with dynamic TTL (frequently accessed items last longer)
 * const cache = new Cache({
 *   ttl: 60000,
 *   dynamicTTL: true,
 *   dynamicTTLMultiplier: 1.2,
 *   dynamicTTLMaxMultiplier: 3
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Per-manager cache configuration in Client
 * const client = new Client({
 *   cache: {
 *     guilds: { maxSize: 1000, ttl: 3600000 },
 *     users: { maxSize: 10000, ttl: 1800000, dynamicTTL: true },
 *     channels: { maxSize: 5000, ttl: 1800000 },
 *     messages: { maxSize: 100, ttl: 60000 },
 *     members: { maxSize: 1000, ttl: 300000 },
 *     roles: { maxSize: 500, ttl: 600000 },
 *     emojis: { maxSize: 200, ttl: 600000 },
 *     stickers: { maxSize: 200, ttl: 600000 }
 *   }
 * });
 * ```
 */
export class Cache<K, V> {
  private readonly _map: Map<K, CacheEntry<V>>;
  private readonly _options: CacheOptions<V> & {
    maxSize: number;
    dynamicTTL: boolean;
    dynamicTTLMultiplier: number;
    dynamicTTLMaxMultiplier: number;
    cleanupInterval: number;
    enabled: boolean;
    trackAccess: boolean;
  };
  private _cleanupInterval: NodeJS.Timeout | null = null;
  private _hits = 0;
  private _misses = 0;

  /**
   * Creates a new Cache instance with optional configuration
   * @param options - Cache configuration options
   *
   * @remarks
   * By default, the cache has unlimited size and no TTL.
   * Configure maxSize and/or ttl to enable automatic eviction.
   */
  constructor(options: CacheOptions<V> = {}) {
    this._map = new Map();
    this._options = {
      maxSize: options.maxSize ?? Number.POSITIVE_INFINITY,
      ttl: options.ttl ?? undefined,
      dynamicTTL: options.dynamicTTL ?? false,
      dynamicTTLMultiplier: options.dynamicTTLMultiplier ?? 1.1,
      dynamicTTLMaxMultiplier: options.dynamicTTLMaxMultiplier ?? 5,
      keepPredicate: options.keepPredicate ?? undefined,
      cleanupInterval: options.cleanupInterval ?? 60000,
      enabled: options.enabled ?? true,
      trackAccess: options.trackAccess ?? true,
    };

    // Start cleanup if TTL is set and interval is enabled
    if (this._options.ttl && this._options.cleanupInterval > 0) {
      this.startCleanupInterval();
    }
  }

  /**
   * Gets the cache configuration options
   */
  public get options(): CacheOptions<V> & {
    maxSize: number;
    dynamicTTL: boolean;
    dynamicTTLMultiplier: number;
    dynamicTTLMaxMultiplier: number;
    cleanupInterval: number;
    enabled: boolean;
    trackAccess: boolean;
  } {
    return { ...this._options };
  }

  /**
   * Gets the current number of items in the cache
   */
  public get size(): number {
    return this._map.size;
  }

  /**
   * Checks if the cache is enabled
   */
  public get enabled(): boolean {
    return this._options.enabled;
  }

  /**
   * Sets a value in the cache
   * @param key - The key to set
   * @param value - The value to set
   * @param itemOptions - Override options for this specific item
   * @returns The cache instance for chaining
   *
   * @remarks
   * If maxSize is exceeded, the least recently used item will be evicted.
   * If TTL is set, the item will expire after the specified time.
   */
  public set(
    key: K,
    value: V,
    itemOptions?: { ttl?: number; keepForever?: boolean; dynamicTTL?: boolean },
  ): this {
    if (!this._options.enabled) {
      return this;
    }

    // Evict if at max capacity
    if (this._options.maxSize !== Number.POSITIVE_INFINITY && this.size >= this._options.maxSize) {
      this.evictOldest();
    }

    const now = Date.now();
    const entry: CacheEntry<V> = {
      value,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
    };

    // Determine TTL for this item
    const ttl = itemOptions?.ttl ?? this._options.ttl;
    const keepForever = itemOptions?.keepForever ?? false;
    const useDynamicTTL = itemOptions?.dynamicTTL ?? this._options.dynamicTTL;

    if (ttl && !keepForever) {
      entry.expiresAt = now + ttl;
      (entry as CacheEntry<V> & { _dynamicTTL: boolean })._dynamicTTL = useDynamicTTL;
    }

    this._map.set(key, entry);
    return this;
  }

  /**
   * Gets a value from the cache
   * @param key - The key to get
   * @returns The value or undefined if not found or expired
   *
   * @remarks
   * Accessing an item updates its lastAccessedAt and accessCount.
   * If dynamicTTL is enabled, frequently accessed items get extended TTL.
   */
  public get(key: K): V | undefined {
    if (!this._options.enabled) {
      return undefined;
    }

    const entry = this._map.get(key);

    if (!entry) {
      this._misses++;
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._map.delete(key);
      this._misses++;
      return undefined;
    }

    // Update access tracking
    if (this._options.trackAccess) {
      entry.lastAccessedAt = Date.now();
      entry.accessCount++;

      // Apply dynamic TTL if enabled
      if (entry.expiresAt && (entry as CacheEntry<V> & { _dynamicTTL?: boolean })._dynamicTTL) {
        const originalTTL = entry.expiresAt - entry.createdAt;
        const currentTTL = entry.expiresAt - Date.now();
        const multiplier = Math.min(
          this._options.dynamicTTLMultiplier,
          this._options.dynamicTTLMaxMultiplier,
        );
        const newTTL = Math.min(
          currentTTL * multiplier,
          originalTTL * this._options.dynamicTTLMaxMultiplier,
        );
        entry.expiresAt = Date.now() + newTTL;
      }

      this._map.set(key, entry);
    }

    this._hits++;
    return entry.value;
  }

  /**
   * Checks if a key exists in the cache and is not expired
   * @param key - The key to check
   * @returns Whether the key exists and is valid
   */
  public has(key: K): boolean {
    if (!this._options.enabled) {
      return false;
    }

    const entry = this._map.get(key);

    if (!entry) {
      return false;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._map.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Deletes a key from the cache
   * @param key - The key to delete
   * @returns Whether the key was deleted
   */
  public delete(key: K): boolean {
    return this._map.delete(key);
  }

  /**
   * Clears all items from the cache
   */
  public clear(): void {
    this._map.clear();
  }

  /**
   * Gets the raw cache entry (including metadata)
   * @param key - The key to get
   * @returns The cache entry or undefined
   */
  public getEntry(key: K): CacheEntry<V> | undefined {
    return this._map.get(key);
  }

  /**
   * Gets the remaining TTL of a cached item in milliseconds
   * @param key - The key to check
   * @returns The remaining TTL or undefined if no TTL
   */
  public getRemainingTTL(key: K): number | undefined {
    const entry = this._map.get(key);
    if (!entry?.expiresAt) {
      return undefined;
    }

    return Math.max(0, entry.expiresAt - Date.now());
  }

  /**
   * Refreshes the TTL of a cached item
   * @param key - The key to refresh
   * @param ttl - Optional new TTL in milliseconds
   * @returns Whether the item was refreshed
   */
  public refresh(key: K, ttl?: number): boolean {
    const entry = this._map.get(key);
    if (!entry) {
      return false;
    }

    const newTTL = ttl ?? this._options.ttl;
    if (newTTL) {
      entry.expiresAt = Date.now() + newTTL;
      (entry as CacheEntry<V> & { _dynamicTTL: boolean })._dynamicTTL = this._options.dynamicTTL;
    } else {
      entry.expiresAt = undefined;
    }

    entry.lastAccessedAt = Date.now();
    this._map.set(key, entry);
    return true;
  }

  /**
   * Updates a value in the cache without changing its TTL or access stats
   * @param key - The key to update
   * @param value - The new value
   * @returns Whether the item was updated
   */
  public update(key: K, value: V): boolean {
    const entry = this._map.get(key);
    if (!entry) {
      return false;
    }

    entry.value = value;
    this._map.set(key, entry);
    return true;
  }

  /**
   * Gets or sets a value in the cache
   * @param key - The key to get or set
   * @param defaultValue - The default value to set if not found (can be a function)
   * @returns The existing or default value
   */
  public getOrSet(key: K, defaultValue: V | (() => V)): V {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = typeof defaultValue === "function" ? (defaultValue as () => V)() : defaultValue;
    this.set(key, value);
    return value;
  }

  /**
   * Evicts the least recently used item from the cache
   * @returns Whether an item was evicted
   */
  private evictOldest(): boolean {
    if (this.size === 0) {
      return false;
    }

    let lruKey: K | undefined;
    let lruTime = Number.POSITIVE_INFINITY;

    // Find least recently used item
    for (const [key, entry] of this._map.entries()) {
      if (entry.lastAccessedAt < lruTime) {
        // Check if this item should be kept
        if (entry && this._options.keepPredicate?.(entry.value, key)) {
          continue;
        }
        lruTime = entry.lastAccessedAt;
        lruKey = key;
      }
    }

    if (lruKey !== undefined) {
      this._map.delete(lruKey);
      return true;
    }

    return false;
  }

  /**
   * Runs cleanup to remove expired items and enforce max size
   * @returns The number of items removed
   */
  public cleanup(): number {
    const now = Date.now();
    let removed = 0;

    // Remove expired items
    for (const [key, entry] of this._map.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        const value = entry.value;
        // Check if item should be kept despite expiration
        if (this._options.keepPredicate?.(value, key)) {
          entry.expiresAt = now + (this._options.ttl ?? 60000);
          this._map.set(key, entry);
        } else {
          this._map.delete(key);
          removed++;
        }
      }
    }

    // Enforce max size
    while (
      this._options.maxSize !== Number.POSITIVE_INFINITY &&
      this.size > this._options.maxSize
    ) {
      if (!this.evictOldest()) {
        break;
      }
      removed++;
    }

    return removed;
  }

  /**
   * Starts the automatic cleanup interval
   */
  public startCleanupInterval(): void {
    if (this._cleanupInterval) {
      this.stopCleanupInterval();
    }

    this._cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this._options.cleanupInterval);

    if (this._cleanupInterval.unref) {
      this._cleanupInterval.unref();
    }
  }

  /**
   * Stops the automatic cleanup interval
   */
  public stopCleanupInterval(): void {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }

  /**
   * Gets comprehensive statistics about the cache
   * @returns Cache statistics including hits, misses, and performance metrics
   */
  public getStats(): CacheStats {
    const now = Date.now();
    let expiredCount = 0;
    let totalAge = 0;
    let oldestAge = Number.POSITIVE_INFINITY;
    let newestAge = 0;

    for (const entry of this._map.values()) {
      const age = now - entry.createdAt;
      totalAge += age;

      if (age < oldestAge) {
        oldestAge = age;
      }

      if (age > newestAge) {
        newestAge = age;
      }

      if (entry.expiresAt && now > entry.expiresAt) {
        expiredCount++;
      }
    }

    const total = this._hits + this._misses;

    return {
      size: this.size,
      maxSize: this._options.maxSize === Number.POSITIVE_INFINITY ? 0 : this._options.maxSize,
      expiredCount,
      avgAge: this.size > 0 ? totalAge / this.size : 0,
      oldestAge: this.size > 0 ? oldestAge : 0,
      newestAge: this.size > 0 ? newestAge : 0,
      hits: this._hits,
      misses: this._misses,
      hitRatio: total > 0 ? this._hits / total : 0,
    };
  }

  /**
   * Resets cache statistics (hits and misses)
   */
  public resetStats(): void {
    this._hits = 0;
    this._misses = 0;
  }

  /**
   * Clones the cache with the same configuration and entries
   * @returns A new cache with the same entries
   */
  public clone(): Cache<K, V> {
    const cloned = new Cache<K, V>(this._options);
    for (const [key, entry] of this._map.entries()) {
      cloned.set(key, entry.value, {
        ttl: entry.expiresAt ? entry.expiresAt - entry.createdAt : undefined,
      });
    }
    return cloned;
  }

  /**
   * Destroys the cache, stops cleanup interval, and clears all entries
   */
  public destroy(): void {
    this.stopCleanupInterval();
    this.clear();
  }

  /**
   * Returns an iterator over the keys in the cache (excluding expired items)
   * @returns An iterator over the keys
   */
  public *keys(): IterableIterator<K> {
    const now = Date.now();
    for (const [key, entry] of this._map.entries()) {
      if (!entry.expiresAt || now <= entry.expiresAt) {
        yield key;
      }
    }
  }

  /**
   * Returns an iterator over the values in the cache (excluding expired items)
   * @returns An iterator over the values
   */
  public *values(): IterableIterator<V> {
    const now = Date.now();
    for (const entry of this._map.values()) {
      if (!entry.expiresAt || now <= entry.expiresAt) {
        yield entry.value;
      }
    }
  }

  /**
   * Returns an iterator over the entries in the cache (excluding expired items)
   * @returns An iterator over the [key, value] entries
   */
  public *entries(): IterableIterator<[K, V]> {
    const now = Date.now();
    for (const [key, entry] of this._map.entries()) {
      if (!entry.expiresAt || now <= entry.expiresAt) {
        yield [key, entry.value];
      }
    }
  }

  /**
   * Executes a provided function once for each cache element
   * @param callbackfn - The function to execute for each element
   * @param thisArg - The value to use as `this` when executing the function
   */
  public forEach(callbackfn: (value: V, key: K, cache: this) => void, _thisArg?: unknown): void {
    const now = Date.now();
    for (const [key, entry] of this._map.entries()) {
      if (!entry.expiresAt || now <= entry.expiresAt) {
        callbackfn(entry.value, key, this);
      }
    }
  }

  /**
   * Returns a string representation of the cache
   * @returns A string representation
   */
  public toString(): string {
    return `Cache(${this.size})`;
  }

  /**
   * Returns a JSON representation of the cache (for debugging)
   * @returns An object with cache info
   */
  public toJSON(): { size: number; options: CacheOptions<V>; stats: CacheStats } {
    return {
      size: this.size,
      options: this.options,
      stats: this.getStats(),
    };
  }
}

export default Cache;
