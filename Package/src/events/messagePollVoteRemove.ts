import type Client from "@/client";
import type { GatewayMessagePollVoteRemoveDispatchData } from "discord-api-types/v10";

export default class MessagePollVoteRemove {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessagePollVoteRemoveDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayMessagePollVoteRemoveDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("messagePollVoteRemove", packet);
  }
}
