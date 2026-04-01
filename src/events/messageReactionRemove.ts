import type { GatewayMessageReactionRemoveDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import MessageReactionStructure from "../structures/MessageReactionStructure";

export default class MessageReactionRemove {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageReactionRemoveDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageReactionRemoveDispatchData }): Promise<void> {
    const packet = data.d;

    const reactionStructure = new MessageReactionStructure(
      packet,
      packet.message_id,
      packet.channel_id,
      this.client,
    );
    this.client.emit("messageReactionRemove", reactionStructure);
  }
}
