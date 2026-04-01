import type Client from "../client";
import { Collection } from "../utils/Collection";

export interface CollectorOptions<T> {
  /** Time to wait in milliseconds before stopping the collector */
  time?: number;
  /** Maximum number of items to collect */
  max?: number;
  /** Maximum number of items to process per second */
  maxProcessing?: number;
  /** Filter function to determine if an item should be collected */
  filter?: (item: T, ...args: unknown[]) => boolean | Promise<boolean>;
  /** Whether to dispose items when they are removed */
  dispose?: boolean;
  /** Whether to reset the timer when an item is collected */
  resetTimer?: boolean;
}

export interface CollectorEvent<T, K> {
  collect: (item: T, ...args: unknown[]) => void;
  ignore: (item: T, ...args: unknown[]) => void;
  dispose: (item: T, ...args: unknown[]) => void;
  end: (collected: Collection<K, T>, reason: string) => void;
}

abstract class Collector<K, T, F extends unknown[] = unknown[]> {
  public readonly client: Client;
  public readonly collected: Collection<K, T>;
  public readonly filter: (item: T, ...args: F) => boolean | Promise<boolean>;
  public readonly dispose: boolean;
  public readonly resetTimer: boolean;
  public readonly max: number | null;
  public readonly maxProcessing: number | null;
  public readonly time: number | null;
  private _timeout: NodeJS.Timeout | null;
  private _timeoutInterval: NodeJS.Timeout | null;
  private _processingTimeout: NodeJS.Timeout | null;
  private _lastCollectedTime: number;
  private _collectedCount: number;
  public ended: boolean;
  public endReason: string | null;

  constructor(client: Client, options: CollectorOptions<T> = {}) {
    this.client = client;
    this.collected = new Collection();
    this.filter = options.filter ?? (() => true);
    this.dispose = options.dispose ?? false;
    this.resetTimer = options.resetTimer ?? false;
    this.max = options.max ?? null;
    this.maxProcessing = options.maxProcessing ?? null;
    this.time = options.time ?? null;
    this._timeout = null;
    this._timeoutInterval = null;
    this._processingTimeout = null;
    this._lastCollectedTime = 0;
    this._collectedCount = 0;
    this.ended = false;
    this.endReason = null;

    if (this.time) {
      this._timeout = setTimeout(() => this.stop("time"), this.time);
      if (this._timeout.unref) {
        this._timeout.unref();
      }
    }

    if (this.maxProcessing) {
      this._timeoutInterval = setInterval(() => {
        const now = Date.now();
        if (now - this._lastCollectedTime > 1000) {
          this._collectedCount = 0;
        }
      }, 1000);
      if (this._timeoutInterval.unref) {
        this._timeoutInterval.unref();
      }
    }
  }

  /**
   * Handles incoming items
   * @param item - The item to handle
   * @param args - Additional arguments
   * @returns Whether the item was collected
   */
  public async handle(item: T, ...args: F): Promise<boolean> {
    if (this.ended) {
      return false;
    }

    const filterResult = await Promise.resolve(this.filter(item, ...args));

    if (!filterResult) {
      this.emit("ignore", item, ...args);
      return false;
    }

    // Check max processing
    if (this.maxProcessing) {
      const now = Date.now();
      if (now - this._lastCollectedTime > 1000) {
        this._collectedCount = 0;
      }
      this._lastCollectedTime = now;
      this._collectedCount++;

      if (this._collectedCount > this.maxProcessing) {
        this.emit("ignore", item, ...args);
        return false;
      }
    }

    // Check max
    if (this.max && this.collected.size >= this.max) {
      this.stop("max");
      return false;
    }

    const key = this.getKey(item, ...args);
    this.collected.set(key, item);
    this.emit("collect", item, ...args);

    if (this.resetTimer && this.time) {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      this._timeout = setTimeout(() => this.stop("time"), this.time);
      if (this._timeout.unref) {
        this._timeout.unref();
      }
    }

    this.checkEnd();
    return true;
  }

  /**
   * Handles incoming items with custom arguments
   * @param item - The item to handle
   * @param extraArgs - Extra arguments for getKey
   * @returns Whether the item was collected
   */
  public async handleWithArgs(item: T, ...extraArgs: F): Promise<boolean> {
    if (this.ended) {
      return false;
    }

    const filterResult = await Promise.resolve(this.filter(item, ...extraArgs));

    if (!filterResult) {
      this.emit("ignore", item, ...extraArgs);
      return false;
    }

    // Check max processing
    if (this.maxProcessing) {
      const now = Date.now();
      if (now - this._lastCollectedTime > 1000) {
        this._collectedCount = 0;
      }
      this._lastCollectedTime = now;
      this._collectedCount++;

      if (this._collectedCount > this.maxProcessing) {
        this.emit("ignore", item, ...extraArgs);
        return false;
      }
    }

    // Check max
    if (this.max && this.collected.size >= this.max) {
      this.stop("max");
      return false;
    }

    const key = this.getKey(item, ...extraArgs);
    this.collected.set(key, item);
    this.emit("collect", item, ...extraArgs);

    if (this.resetTimer && this.time) {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      this._timeout = setTimeout(() => this.stop("time"), this.time);
      if (this._timeout.unref) {
        this._timeout.unref();
      }
    }

    this.checkEnd();
    return true;
  }

  /**
   * Gets the key for an item
   * @param item - The item to get the key for
   * @param args - Additional arguments
   * @returns The key
   */
  protected abstract getKey(item: T, ...args: F): K;

  /**
   * Emits an event
   * @param event - The event to emit
   * @param args - Event arguments
   */
  protected emit(_event: keyof CollectorEvent<T, K>, ..._args: unknown[]): void {
    // Subclasses should implement this
  }

  /**
   * Checks if the collector should end
   */
  protected checkEnd(): void {
    // Subclasses should implement this
  }

  /**
   * Stops the collector
   * @param reason - The reason for stopping
   */
  public stop(reason = "user"): void {
    if (this.ended) {
      return;
    }

    this.ended = true;
    this.endReason = reason;

    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }

    if (this._timeoutInterval) {
      clearInterval(this._timeoutInterval);
      this._timeoutInterval = null;
    }

    if (this._processingTimeout) {
      clearTimeout(this._processingTimeout);
      this._processingTimeout = null;
    }

    this.emit("end", this.collected, reason);
  }

  /**
   * Resets the collector's timeout
   */
  public resetTimeout(): void {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    if (this.time) {
      this._timeout = setTimeout(() => this.stop("time"), this.time);
      if (this._timeout.unref) {
        this._timeout.unref();
      }
    }
  }

  /**
   * Gets the total number of collected items
   */
  public get total(): number {
    return this.collected.size;
  }

  /**
   * Gets whether the collector is collecting
   */
  public get collecting(): boolean {
    return !this.ended;
  }
}

export default Collector;
