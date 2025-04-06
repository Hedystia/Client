import type { APIGuild } from "discord-api-types/v10";

export type CacheAPIGuild = Pick<
  APIGuild,
  Exclude<
    keyof APIGuild,
    | "stickers"
    | "region"
    | "roles"
    | "emojis"
    | "approximate_member_count"
    | "approximate_presence_count"
    | "application_id"
  >
>;
