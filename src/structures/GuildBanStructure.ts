import type { GatewayGuildBanModifyDispatchData } from "discord-api-types/v10";
import type Client from "../client";

class GuildBanStructure<
  T extends GatewayGuildBanModifyDispatchData = GatewayGuildBanModifyDispatchData,
> {
  public readonly client: Client;
  public readonly guildId: string;

  constructor(data: T, guildId: string, client: Client) {
    Object.assign(this, data);
    this.guildId = guildId;
    this.client = client;
  }

  public get user(): GatewayGuildBanModifyDispatchData["user"] {
    return (this as unknown as GatewayGuildBanModifyDispatchData).user;
  }

  public get userId(): string {
    return this.user?.id;
  }

  public get username(): string {
    return this.user?.username;
  }
}

export default GuildBanStructure as new <
  T extends GatewayGuildBanModifyDispatchData = GatewayGuildBanModifyDispatchData,
>(
  data: T,
  guildId: string,
  client: Client,
) => GuildBanStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type GuildBanStructureInstance = GuildBanStructure &
  GatewayGuildBanModifyDispatchData & { readonly guildId: string; readonly client: Client };
