import type { GatewayAutoModerationRuleUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";
import AutoModerationRuleStructure from "../structures/AutoModerationRuleStructure";

export default class AutoModerationRuleUpdate {
  client: Client;

  constructor(
    client: Client,
    data: {
      d: GatewayAutoModerationRuleUpdateDispatchData;
    },
  ) {
    this.client = client;
    this._patch(data);
  }

  async _patch(data: { d: GatewayAutoModerationRuleUpdateDispatchData }): Promise<void> {
    const packet = data.d;

    const ruleStructure = new AutoModerationRuleStructure(packet, packet.guild_id, this.client);
    this.client.emit("autoModerationRuleUpdate", ruleStructure);
  }
}
