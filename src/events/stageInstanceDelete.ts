import type { GatewayStageInstanceDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class StageInstanceDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayStageInstanceDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayStageInstanceDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("stageInstanceDelete", packet);
  }
}
