import type { GatewayStageInstanceCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import StageInstanceStructure from "../structures/StageInstanceStructure";

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

  async _patch(data: { d: GatewayStageInstanceCreateDispatchData }): Promise<void> {
    const packet = data.d;

    const instanceStructure = new StageInstanceStructure(packet, this.client);
    this.client.stageInstances._add(instanceStructure, { enabled: true, force: false });

    this.client.emit("stageInstanceCreate", instanceStructure);
  }
}
