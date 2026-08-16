import type {
  APIBan,
  GatewayGuildBanAddDispatchData,
  GatewayGuildBanRemoveDispatchData,
} from "discord-api-types/v10";
import type Client from "../client";

/**
 * Official Discord payloads that can represent a guild ban.
 *
 * REST responses include a reason, while Gateway ban events do not.
 */
type GuildBanData = APIBan | GatewayGuildBanAddDispatchData | GatewayGuildBanRemoveDispatchData;

/**
 * Represents a guild ban returned by Discord's REST API or Gateway.
 *
 * @template T - The official Discord ban payload type.
 */
class GuildBanStructure<T extends GuildBanData = GuildBanData> {
  public readonly client: Client;
  public readonly guildId: string;

  /**
   * Creates a guild ban structure.
   *
   * @param data - The official Discord ban payload.
   * @param guildId - The guild containing the ban.
   * @param client - The client instance.
   */
  public constructor(data: T, guildId: string, client: Client) {
    for (const key in data) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = data[key as keyof T];
      }
    }
    this.guildId = guildId;
    this.client = client;
  }

  /**
   * The banned user.
   */
  public get user(): T["user"] {
    return (this as unknown as T).user;
  }

  /**
   * The banned user's ID.
   */
  public get userId(): string {
    return this.user.id;
  }

  /**
   * The banned user's username.
   */
  public get username(): string {
    return this.user.username;
  }
}

export default GuildBanStructure as new <T extends GuildBanData = GuildBanData>(
  data: T,
  guildId: string,
  client: Client,
) => GuildBanStructure<T> & T & { readonly guildId: string; readonly client: Client };

export type GuildBanStructureInstance = GuildBanStructure &
  GuildBanData & { readonly guildId: string; readonly client: Client };
