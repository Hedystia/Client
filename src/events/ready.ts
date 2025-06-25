import { type APIUser, type GatewayReadyDispatchData, Routes } from "discord-api-types/v10";
import type Client from "../client";

export default class Ready {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayReadyDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayReadyDispatchData }): Promise<void> {
    const packet = data.d;
    const user = (await this.client.rest.get(Routes.user(packet.user.id))) as APIUser;
    this.client.me = user;
    this.client.emit("ready", packet);
  }
}
