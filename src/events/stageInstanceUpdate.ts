import type { GatewayStageInstanceUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class StageInstanceUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayStageInstanceUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayStageInstanceUpdateDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("stageInstanceUpdate", packet);
  }
}
