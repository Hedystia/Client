import type { GatewayInviteDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class InviteDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayInviteDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayInviteDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("inviteDelete", packet);
  }
}
