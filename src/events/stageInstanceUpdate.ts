import type { GatewayStageInstanceUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import StageInstanceStructure from "../structures/StageInstanceStructure";

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

    const instanceStructure = new StageInstanceStructure(packet, this.client);
    this.client.stageInstances._add(instanceStructure, { enabled: true, force: true });

    this.client.emit("stageInstanceUpdate", instanceStructure);
  }
}
