import type {
  GatewayInviteCreateDispatchData,
  GatewayInviteDeleteDispatchData,
} from "discord-api-types/v10";
import type Client from "../client";
import InviteStructure from "../structures/InviteStructure";

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

    const cachedInvite = this.client.invites.cache.get(packet.code);
    if (cachedInvite) {
      this.client.emit("inviteDelete", cachedInvite);
      this.client.invites._remove(packet.code);
    } else {
      const inviteStructure = new InviteStructure(
        packet as GatewayInviteCreateDispatchData,
        this.client,
      );
      this.client.emit("inviteDelete", inviteStructure);
    }
  }
}
