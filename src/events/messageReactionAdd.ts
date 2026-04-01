import type { GatewayMessageReactionAddDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import MessageReactionStructure from "../structures/MessageReactionStructure";

export default class MessageReactionAdd {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageReactionAddDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageReactionAddDispatchData }): Promise<void> {
    const packet = data.d;

    const reactionStructure = new MessageReactionStructure(
      packet,
      packet.message_id,
      packet.channel_id,
      this.client,
    );
    this.client.emit("messageReactionAdd", reactionStructure);
  }
}
