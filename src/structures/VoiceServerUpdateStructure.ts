import type { GatewayVoiceServerUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class VoiceServerUpdateStructure<
  T extends GatewayVoiceServerUpdateDispatchData = GatewayVoiceServerUpdateDispatchData,
> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
    this.client = client;
  }

  public get token(): string {
    return (this as unknown as GatewayVoiceServerUpdateDispatchData).token;
  }

  public get guildId(): string {
    return (this as unknown as GatewayVoiceServerUpdateDispatchData).guild_id;
  }

  public get endpoint(): string | null {
    return (this as unknown as GatewayVoiceServerUpdateDispatchData).endpoint ?? null;
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
