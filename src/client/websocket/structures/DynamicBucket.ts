/**
 * Configuration for {@link DynamicBucket}.
 */
export interface DynamicBucketOptions {
  /** Maximum number of acquisitions per `refillInterval`. */
  limit: number;
  /** Time in ms before the bucket fully refills. */
  refillInterval: number;
}

/**
 * Token-bucket rate limiter with deferred refills, used to throttle generic
 * gateway sends from a single shard.
 */
export class DynamicBucket {
  private readonly queue: ((value?: unknown) => void)[] = [];
  private used = 0;
  private processing = false;
  private refillsAt: number | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  /**
   * @param options - Bucket configuration.
   */
  public constructor(public readonly options: DynamicBucketOptions) {}

  /**
   * Number of remaining tokens in the current window.
   */
  public get remaining(): number {
    return this.options.limit < this.used ? 0 : this.options.limit - this.used;
  }

  /**
   * Acquires a token. Resolves once the bucket has capacity.
   *
   * @param force - If `true`, bypasses any waiting entries.
   */
  public acquire(force = false): Promise<unknown> {
    return new Promise((resolve) => {
      if (force) {
        this.queue.unshift(resolve);
      } else {
        this.queue.push(resolve);
      }
      this.processQueue();
    });
  }

  private refill(): void {
    this.refillsAt = null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.used > 0) {
      this.used = 0;
      this.timeoutId = setTimeout(() => this.refill(), this.options.refillInterval);
      this.refillsAt = Date.now() + this.options.refillInterval;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }
    this.processing = true;

    while (this.queue.length > 0) {
      if (this.remaining > 0) {
        const next = this.queue.shift();
        next?.();
        this.used++;
        if (this.timeoutId === null) {
          this.timeoutId = setTimeout(() => this.refill(), this.options.refillInterval);
          this.refillsAt = Date.now() + this.options.refillInterval;
        }
      } else if (this.refillsAt !== null) {
        const refillsAt = this.refillsAt;
        const now = Date.now();
        if (refillsAt > now) {
          await new Promise<void>((resolve) => setTimeout(resolve, refillsAt - now));
          this.used = 0;
        }
      }
    }

    this.processing = false;
  }

  /**
   * Splits an array into roughly equal chunks of size `chunks`.
   */
  public static chunk<T>(array: T[], chunks: number): T[][] {
    const result: T[][] = new Array(Math.ceil(array.length / chunks));
    let index = 0;
    let resIndex = 0;
    while (index < array.length) {
      index += chunks;
      result[resIndex++] = array.slice(index - chunks, index);
    }
    return result;
  }
}
