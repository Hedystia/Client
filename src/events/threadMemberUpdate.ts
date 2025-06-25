import type { GatewayThreadMemberUpdateDispatchData } from "discord-api-types/v10";
import type Client from "@/client";

export default class ThreadMemberUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayThreadMemberUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayThreadMemberUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("threadMemberUpdate", packet);
  }
}
