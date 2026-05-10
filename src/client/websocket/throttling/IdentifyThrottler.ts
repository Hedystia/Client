import { AsyncQueue } from "../structures/AsyncQueue";
import type { IIdentifyThrottler } from "./IIdentifyThrottler";

/**
 * Per-key state tracked by {@link IdentifyThrottler}.
 */
interface IdentifyState {
  queue: AsyncQueue;
  resetsAt: number;
}

/**
 * In-memory implementation of {@link IIdentifyThrottler}.
 */
export class IdentifyThrottler implements IIdentifyThrottler {
  private readonly states = new Map<number, IdentifyState>();

  /**
   * @param maxConcurrency - The gateway-reported `max_concurrency` value.
   */
  public constructor(private readonly maxConcurrency: number) {}

  /**
   * @inheritdoc
   */
  public async waitForIdentify(shardId: number, signal: AbortSignal): Promise<void> {
    const key = shardId % this.maxConcurrency;

    let state = this.states.get(key);
    if (!state) {
      state = { queue: new AsyncQueue(), resetsAt: Number.POSITIVE_INFINITY };
      this.states.set(key, state);
    }

    await state.queue.wait();

    if (signal.aborted) {
      state.queue.shift();
      throw new Error("Identify aborted");
    }

    try {
      const diff = state.resetsAt - Date.now();
      if (diff > 0 && diff <= 5_000) {
        const wait = diff + Math.random() * 1_500;
        await new Promise<void>((resolve) => setTimeout(resolve, wait));
      }
      state.resetsAt = Date.now() + 5_000;
    } finally {
      state.queue.shift();
    }
  }
}
