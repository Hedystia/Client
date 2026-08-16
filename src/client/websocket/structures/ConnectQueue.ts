/**
 * Throttled queue used to start shards while respecting Discord's
 * `max_concurrency` limit during the IDENTIFY phase.
 *
 * @see {@link https://discord.com/developers/docs/topics/gateway#sharding-max-concurrency}
 */
export class ConnectQueue {
  private readonly queue: (() => unknown)[] = [];
  private remaining: number;
  private interval: NodeJS.Timeout | null = null;

  /**
   * Creates a new connect queue.
   *
   * @param intervalTime - Time window in ms between identify bursts.
   * @param concurrency - Maximum number of callbacks started per window.
   */
  public constructor(
    public readonly intervalTime = 5_500,
    public readonly concurrency = 1,
  ) {
    if (concurrency < 1) {
      throw new RangeError("ConnectQueue concurrency must be at least 1");
    }
    if (intervalTime < 0) {
      throw new RangeError("ConnectQueue intervalTime cannot be negative");
    }
    this.remaining = concurrency;
  }

  /**
   * Enqueues a callback and starts it when the current burst has capacity.
   */
  public push(callback: () => unknown): void {
    this.queue.push(callback);
    this.drain();
  }

  /**
   * Cancels callbacks that have not started and resets the current burst.
   */
  public clear(): void {
    this.queue.length = 0;
    this.remaining = this.concurrency;
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
  }

  private drain(): void {
    while (this.remaining > 0 && this.queue.length > 0) {
      this.remaining--;
      this.queue.shift()?.();
    }

    if (this.remaining < this.concurrency && this.interval === null) {
      this.interval = setTimeout(() => {
        this.interval = null;
        this.remaining = this.concurrency;
        this.drain();
      }, this.intervalTime);
    }
  }
}

/**
 * Simple barrier that ensures consecutive callers wait `intervalTime`
 * milliseconds between each call.
 */
export class ConnectTimeout {
  private readonly waiters: ((value: boolean) => void)[] = [];
  private interval: NodeJS.Timeout | null = null;

  /**
   * @param intervalTime - Wait time in ms between consecutive resolutions.
   */
  public constructor(public intervalTime = 5_000) {}

  /**
   * Returns a promise that resolves when the next slot is available.
   */
  public wait(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (this.waiters.length === 0) {
        this.interval = setInterval(() => this.shift(), this.intervalTime);
        resolve(true);
        return;
      }
      this.waiters.push(resolve);
    });
  }

  private shift(): void {
    this.waiters.shift()?.(true);
    if (this.waiters.length === 0 && this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
