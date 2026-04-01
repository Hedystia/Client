import type { GatewayTypingStartDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class TypingStartStructure<
  T extends GatewayTypingStartDispatchData = GatewayTypingStartDispatchData,
> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    Object.assign(this, data);
    this.client = client;
  }

  public get channelId(): string {
    return (this as unknown as GatewayTypingStartDispatchData).channel_id;
  }

  public get userId(): string {
    return (this as unknown as GatewayTypingStartDispatchData).user_id;
  }

  public get guildId(): string | null {
    return (this as unknown as GatewayTypingStartDispatchData).guild_id ?? null;
  }

  public get timestamp(): number {
    return (this as unknown as GatewayTypingStartDispatchData).timestamp;
  }

  public get member(): unknown | null {
    return (this as unknown as GatewayTypingStartDispatchData).member ?? null;
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
