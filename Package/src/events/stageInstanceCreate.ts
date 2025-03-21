import type Client from "@/client";
import type { GatewayStageInstanceCreateDispatchData } from "discord-api-types/v10";

export default class StageInstanceCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayStageInstanceCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayStageInstanceCreateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("stageInstanceCreate", packet);
  }
}
