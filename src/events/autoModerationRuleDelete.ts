import type { GatewayAutoModerationRuleDeleteDispatchData } from "discord-api-types/v10";
import type Client from "../client";

export default class AutoModerationRuleDelete {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayAutoModerationRuleDeleteDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayAutoModerationRuleDeleteDispatchData }): Promise<void> {
    const packet = data.d;
    this.client.emit("autoModerationRuleDelete", packet);
  }
}
