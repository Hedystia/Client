import type { GatewayInteractionCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import InteractionStructure from "../structures/InteractionStructure";

/**
 * Normalizes an `INTERACTION_CREATE` gateway payload and emits its public
 * interaction structure.
 */
export default class InteractionCreate {
  public readonly client: Client;

  /**
   * @param client - The client that received the interaction.
   * @param data - The gateway dispatch payload.
   */
  public constructor(
    client: Client,
    data: {
      d: GatewayInteractionCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  /**
   * Wraps and emits an official Discord interaction payload.
   * @param data - The gateway dispatch payload.
   */
  public async _patch(data: { d: GatewayInteractionCreateDispatchData }): Promise<void> {
    const interaction = new InteractionStructure(data.d, this.client);
    this.client.emit("interactionCreate", interaction);
  }
}
