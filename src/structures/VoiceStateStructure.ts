import type { GatewayVoiceStateUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class VoiceStateStructure<
  T extends GatewayVoiceStateUpdateDispatchData = GatewayVoiceStateUpdateDispatchData,
> {
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.guildId = guildId;
    this.client = client;
  }

  public get userId(): string {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).user_id;
  }

  public get channelId(): string | null {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).channel_id ?? null;
  }

  public get sessionId(): string | null {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).session_id ?? null;
  }

  public get deaf(): boolean {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).deaf ?? false;
  }

  public get mute(): boolean {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).mute ?? false;
  }

  public get selfDeaf(): boolean {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).self_deaf ?? false;
  }

  public get selfMute(): boolean {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).self_mute ?? false;
  }

  public get selfStream(): boolean {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).self_stream ?? false;
  }

  public get selfVideo(): boolean {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).self_video ?? false;
  }

  public get suppress(): boolean {
    return (this as unknown as GatewayVoiceStateUpdateDispatchData).suppress ?? false;
  }
}

export default VoiceStateStructure as new <
  T extends GatewayVoiceStateUpdateDispatchData = GatewayVoiceStateUpdateDispatchData,
>(
  data: T,
  guildId: string,
  client: Client,
) => VoiceStateStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type VoiceStateStructureInstance = VoiceStateStructure &
  GatewayVoiceStateUpdateDispatchData & { readonly guildId: string; readonly client: Client };
