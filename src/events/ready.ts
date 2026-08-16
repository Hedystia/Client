import type { GatewayReadyDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import UserStructure from "../structures/UserStructure";

/**
 * Normalizes the official READY gateway payload and updates client state.
 */
export default class Ready {
  public readonly client: Client;

  /**
   * @param client - The client that received the payload.
   * @param data - The READY gateway dispatch payload.
   * @param shardId - The shard that received READY, when dispatched by the gateway manager.
   */
  public constructor(
    client: Client,
    data: {
      d: GatewayReadyDispatchData;
    },
    shardId?: number,
  ) {
    this.client = client;
    this._patch(data, shardId);
  }

  /**
   * Applies READY data and emits the public event once all selected shards are ready.
   *
   * @param data - The READY gateway dispatch payload.
   * @param shardId - The shard that received READY, when available.
   */
  public async _patch(data: { d: GatewayReadyDispatchData }, shardId?: number): Promise<void> {
    const packet = data.d;
    this.client.me = packet.user;
    const currentUser = new UserStructure(packet.user, this.client);
    this.client.users._add(currentUser, { enabled: true, force: true });

    if (!this.client._markReady(shardId)) {
      return;
    }

    this.client.readyAt = new Date();
    this.client.emit("ready", packet);
  }
}
