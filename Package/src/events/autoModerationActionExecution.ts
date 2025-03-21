import type Client from "@/client";
import type { GatewayAutoModerationActionExecutionDispatchData } from "discord-api-types/v10";

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

  async _patch(data: {
    d: GatewayAutoModerationActionExecutionDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("autoModerationActionExecution", packet);
  }
}
