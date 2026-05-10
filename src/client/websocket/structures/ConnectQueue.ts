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
   * @param intervalTime - Time window in ms between bursts.
   * @param concurrency - Maximum number of items dequeued per window.
   */
  public constructor(
    public intervalTime = 5_500,
    public concurrency = 1,
  ) {
    this.remaining = concurrency;
  }

  /**
   * Enqueues a callback. The callback runs immediately if the burst budget
   * allows it, otherwise it is scheduled for the next available window.
   */
  public push(callback: () => unknown): void {
    if (this.remaining === 0) {
      this.queue.push(callback);
      return;
    }

    this.remaining--;
    if (this.interval === null) {
      this.startInterval();
    }

    if (this.queue.length < this.concurrency) {
      callback();
      return;
    }

    this.queue.push(callback);
  }

  private startInterval(): void {
    this.interval = setInterval(() => {
      const next = this.queue.shift();
      if (next) {
        next();
        return;
      }

      if (this.remaining < this.concurrency) {
        this.remaining++;
      }

      if (this.queue.length === 0 && this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }, this.intervalTime / this.concurrency);
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
