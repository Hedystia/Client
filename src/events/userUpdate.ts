import type { GatewayUserUpdateDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class UserUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayUserUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayUserUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("userUpdate", packet);
  }
}
