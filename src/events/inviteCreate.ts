import type { GatewayInviteCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import InviteStructure from "../structures/InviteStructure";

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

    const inviteStructure = new InviteStructure(packet, this.client);
    this.client.invites._add(inviteStructure, { enabled: true, force: false });

    this.client.emit("inviteCreate", inviteStructure);
  }
}
