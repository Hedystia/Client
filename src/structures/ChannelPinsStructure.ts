import type { GatewayChannelPinsUpdateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class ChannelPinsStructure<
  T extends GatewayChannelPinsUpdateDispatchData = GatewayChannelPinsUpdateDispatchData,
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

export default ChannelPinsStructure as new <
  T extends GatewayChannelPinsUpdateDispatchData = GatewayChannelPinsUpdateDispatchData,
>(
  data: T,
  client: Client,
) => ChannelPinsStructure<T> & T & { readonly client: Client };

export type ChannelPinsStructureInstance = ChannelPinsStructure &
  GatewayChannelPinsUpdateDispatchData & { readonly client: Client };
