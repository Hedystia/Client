import type { GatewayMessageReactionRemoveEmojiDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class MessageReactionRemoveEmoji {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessageReactionRemoveEmojiDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessageReactionRemoveEmojiDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("messageReactionRemoveEmoji", packet);
  }
}
