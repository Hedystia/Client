import type { APIMessage, GatewayMessageUpdateDispatchData } from "discord-api-types/v10";
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
    const cachedMessage = this.client.messages.get(packet.id);
    const messageData = cachedMessage
      ? ({
          ...cachedMessage,
          ...packet,
          author: packet.author ?? cachedMessage.author,
          ...((packet.member ?? cachedMessage.member)
            ? { member: packet.member ?? cachedMessage.member }
            : {}),
        } as GatewayMessageUpdateDispatchData)
      : packet;

    const messageStructure = new MessageStructure(
      messageData as APIMessage,
      packet.channel_id,
      packet.guild_id ?? cachedMessage?.guildId ?? null,
      this.client,
    );
    this.client.emit("messageUpdate", messageStructure);
  }
}
