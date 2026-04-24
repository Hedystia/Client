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

  public get channelId(): string {
    return (this as unknown as GatewayVoiceChannelEffectSendDispatchData).channel_id;
  }

  public get guildId(): string {
    return (this as unknown as GatewayVoiceChannelEffectSendDispatchData).guild_id;
  }

  public get userId(): string {
    return (this as unknown as GatewayVoiceChannelEffectSendDispatchData).user_id;
  }

  public get emoji(): unknown | null {
    return (this as unknown as GatewayVoiceChannelEffectSendDispatchData).emoji ?? null;
  }

  public get animationType(): number | null {
    return (this as unknown as GatewayVoiceChannelEffectSendDispatchData).animation_type ?? null;
  }

  public get animationId(): number | null {
    return (this as unknown as GatewayVoiceChannelEffectSendDispatchData).animation_id ?? null;
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
