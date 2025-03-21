import type Client from "@/client";
import type { GatewayMessagePollVoteAddDispatchData } from "discord-api-types/v10";

export default class MessagePollVoteAdd {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessagePollVoteAddDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayMessagePollVoteAddDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("messagePollVoteAdd", packet);
  }
}
