import type Client from "@/client";
import type { GatewayAutoModerationRuleCreateDispatchData } from "discord-api-types/v10";

export default class AutoModerationRuleCreate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayAutoModerationRuleCreateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: {
    d: GatewayAutoModerationRuleCreateDispatchData;
  }): Promise<void> {
    const packet = data.d;
    this.client.emit("autoModerationRuleCreate", packet);
  }
}
