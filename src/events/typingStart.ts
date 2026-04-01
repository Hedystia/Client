import type { GatewayTypingStartDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import TypingStartStructure from "../structures/TypingStartStructure";

export default class TypingStart {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayTypingStartDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayTypingStartDispatchData }): Promise<void> {
    const packet = data.d;

    const typingStartStructure = new TypingStartStructure(packet, this.client);
    this.client.emit("typingStart", typingStartStructure);
  }
}
