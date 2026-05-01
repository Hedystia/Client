import type { GatewayTypingStartDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class TypingStartStructure<
  T extends GatewayTypingStartDispatchData = GatewayTypingStartDispatchData,
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

export default TypingStartStructure as new <
  T extends GatewayTypingStartDispatchData = GatewayTypingStartDispatchData,
>(
  data: T,
  client: Client,
) => TypingStartStructure<T> & T & { readonly client: Client };

export type TypingStartStructureInstance = TypingStartStructure &
  GatewayTypingStartDispatchData & { readonly client: Client };
