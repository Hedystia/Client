import type { GatewayVoiceServerUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class VoiceServerUpdateStructure<
  T extends GatewayVoiceServerUpdateDispatchData = GatewayVoiceServerUpdateDispatchData,
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

export default VoiceServerUpdateStructure as new <
  T extends GatewayVoiceServerUpdateDispatchData = GatewayVoiceServerUpdateDispatchData,
>(
  data: T,
  client: Client,
) => VoiceServerUpdateStructure<T> & T & { readonly client: Client };

export type VoiceServerUpdateStructureInstance = VoiceServerUpdateStructure &
  GatewayVoiceServerUpdateDispatchData & { readonly client: Client };
