/**
 * Lightweight FIFO async queue used to serialize WebSocket sends.
 *
 * @remarks
 * Inspired by {@link https://github.com/sapphiredev/utilities/tree/main/packages/async-queue | @sapphire/async-queue}.
 * Each call to {@link AsyncQueue.wait} resolves once every previous call has
 * been resolved. {@link AsyncQueue.shift} releases the next pending call.
 *
 * @example
 * ```typescript
 * const queue = new AsyncQueue();
 * await queue.wait();
 * try {
 *   // critical section
 * } finally {
 *   queue.shift();
 * }
 * ```
 */
export class AsyncQueue {
  private readonly promises: { resolve: () => void; promise: Promise<void> }[] = [];

  /**
   * Number of pending tasks (including the currently running one).
   */
  public get remaining(): number {
    return this.promises.length;
  }

  /**
   * Acquires the queue. Resolves immediately if no other task is in progress.
   */
  public wait(): Promise<void> {
    const next = this.promises.length === 0 ? Promise.resolve() : this.promises.at(-1)?.promise;
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });
    this.promises.push({ resolve, promise });
    return next ?? Promise.resolve();
  }

  /**
   * Releases the head of the queue, allowing the next waiter to proceed.
   */
  public shift(): void {
    const head = this.promises.shift();
    head?.resolve();
  }
}
