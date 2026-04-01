import type { GatewayStageInstanceDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import StageInstanceStructure from "../structures/StageInstanceStructure";

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

    const cachedInstance = this.client.stageInstances.cache.get(packet.id);
    if (cachedInstance) {
      this.client.emit("stageInstanceDelete", cachedInstance);
      this.client.stageInstances._remove(packet.id);
    } else {
      const instanceStructure = new StageInstanceStructure(packet, this.client);
      this.client.emit("stageInstanceDelete", instanceStructure);
    }
  }
}
