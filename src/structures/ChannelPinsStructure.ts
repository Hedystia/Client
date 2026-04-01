import type { GatewayChannelPinsUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class ChannelPinsStructure<
  T extends GatewayChannelPinsUpdateDispatchData = GatewayChannelPinsUpdateDispatchData,
> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
    this.client = client;
  }

  public get channelId(): string {
    return (this as unknown as GatewayChannelPinsUpdateDispatchData).channel_id;
  }

  public get guildId(): string | null {
    return (this as unknown as GatewayChannelPinsUpdateDispatchData).guild_id ?? null;
  }

  public get lastPinTimestamp(): string | null {
    return (this as unknown as GatewayChannelPinsUpdateDispatchData).last_pin_timestamp ?? null;
  }
}

export default ChannelPinsStructure as new <
  T extends GatewayChannelPinsUpdateDispatchData = GatewayChannelPinsUpdateDispatchData,
>(
  data: T,
  client: Client,
) => ChannelPinsStructure<T> & T & { readonly client: Client };

export type ChannelPinsStructureInstance = ChannelPinsStructure &
  GatewayChannelPinsUpdateDispatchData & { readonly client: Client };
