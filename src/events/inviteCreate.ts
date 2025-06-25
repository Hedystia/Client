import type { GatewayInviteCreateDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class InviteCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayInviteCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayInviteCreateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("inviteCreate", packet);
  }
}
