/**
 * Contract for any object capable of throttling IDENTIFY payloads.
 *
 * @remarks
 * Discord's gateway enforces a `max_concurrency` limit on identify payloads.
 * Implementations are responsible for serializing identify calls per
 * `(shardId % max_concurrency)` key.
 *
 * @see {@link https://discord.com/developers/docs/topics/gateway#sharding-max-concurrency}
 */
export interface IIdentifyThrottler {
  /**
   * Resolves when the calling shard is allowed to identify.
   *
   * @param shardId - The shard's id.
   * @param signal - Abort signal triggered if the shard closes early.
   */
  waitForIdentify(shardId: number, signal: AbortSignal): Promise<void>;
}
