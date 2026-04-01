import type { GatewayMessageUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import MessageStructure from "../structures/MessageStructure";

export default class MessageUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const messageStructure = new MessageStructure(
      packet,
      packet.channel_id,
      packet.guild_id ?? null,
      this.client,
    );
    this.client.emit("messageUpdate", messageStructure);
  }
}
