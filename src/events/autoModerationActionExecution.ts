import type { GatewayAutoModerationActionExecutionDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import AutoModerationActionStructure from "../structures/AutoModerationActionStructure";

export default class AutoModerationActionExecution {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayAutoModerationActionExecutionDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayAutoModerationActionExecutionDispatchData }): Promise<void> {
    const packet = data.d;

    const actionStructure = new AutoModerationActionStructure(packet, this.client);
    this.client.emit("autoModerationActionExecution", actionStructure);
  }
}
