import type { GatewayMessagePollVoteDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class MessagePollVoteRemove {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayMessagePollVoteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayMessagePollVoteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("messagePollVoteRemove", packet);
  }
}
