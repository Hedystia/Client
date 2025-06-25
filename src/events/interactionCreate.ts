import type { GatewayInteractionCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class InteractionCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayInteractionCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayInteractionCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("interactionCreate", packet);
  }
}
