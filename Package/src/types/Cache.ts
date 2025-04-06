import type { APIGuild } from "discord-api-types/v10";

export type CacheAPIGuild = {
  [K in Exclude<keyof APIGuild, "region">]: K extends
    | "roles"
    | "emojis"
    | "stickers"
    | "approximate_member_count"
    | "approximate_presence_count"
    | "application_id"
    | "region"
    ? APIGuild[K] | null
    : APIGuild[K];
};
