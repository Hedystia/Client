import type { GatewayVoiceChannelEffectSendDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class VoiceChannelEffectSendStructure<
  T extends GatewayVoiceChannelEffectSendDispatchData = GatewayVoiceChannelEffectSendDispatchData,
> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }
}

export default VoiceChannelEffectSendStructure as new <
  T extends GatewayVoiceChannelEffectSendDispatchData = GatewayVoiceChannelEffectSendDispatchData,
>(
  data: T,
  client: Client,
) => VoiceChannelEffectSendStructure<T> & T & { readonly client: Client };

export type VoiceChannelEffectSendStructureInstance = VoiceChannelEffectSendStructure &
  GatewayVoiceChannelEffectSendDispatchData & { readonly client: Client };
