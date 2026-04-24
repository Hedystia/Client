import type { GatewayInviteCreateDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class InviteStructure<T extends GatewayInviteCreateDispatchData = GatewayInviteCreateDispatchData> {
  public readonly client: Client;

  constructor(data: T, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as any)[key] = data[key as keyof T];
      }
    }
    this.client = client;
  }

  public get code(): string {
    return (this as unknown as GatewayInviteCreateDispatchData).code;
  }

  public get channelId(): string {
    return (this as unknown as GatewayInviteCreateDispatchData).channel_id;
  }

  public get guildId(): string | undefined {
    return (this as unknown as GatewayInviteCreateDispatchData).guild_id;
  }

  public get url(): string {
    return `https://discord.gg/${this.code}`;
  }
}

export default InviteStructure as new <
  T extends GatewayInviteCreateDispatchData = GatewayInviteCreateDispatchData,
>(
  data: T,
  client: Client,
) => InviteStructure<T> & T & { readonly client: Client };

export type InviteStructureInstance = InviteStructure &
  GatewayInviteCreateDispatchData & { readonly client: Client };
