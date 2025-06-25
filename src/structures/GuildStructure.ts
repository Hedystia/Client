import type { CacheAPIGuild } from "@/types/Cache";

class GuildStructure<T extends CacheAPIGuild = CacheAPIGuild> {
  constructor(data: T) {
    Object.assign(this, data);
  }
}

export default GuildStructure as new <T extends CacheAPIGuild = CacheAPIGuild>(
  data: T,
) => GuildStructure<T> & T;

export type GuildStructureInstance = InstanceType<typeof GuildStructure> & CacheAPIGuild;
