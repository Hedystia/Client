import type { APIThreadMember } from "discord-api-types/v10";
import type Client from "../client";
import type { ThreadMemberStructureInstance } from "../structures/ThreadMemberStructure";
import ThreadMemberStructure from "../structures/ThreadMemberStructure";
import Cache from "../utils/cache";
import { Routes } from "../utils/constants";

export default class ThreadMemberManager {
  client: Client;
  private readonly _cache = new Cache<string, ThreadMemberStructureInstance>();

  constructor(client: Client) {
    this.client = client;
  }

  public _add(
    data: ThreadMemberStructureInstance,
    cache: { enabled: boolean; force: boolean },
  ): void {
    if (cache.enabled && data.threadId && data.userId) {
      const key = `${data.threadId}:${data.userId}`;
      const member = this._cache.get(key);
      if (member && !cache.force) {
        return;
      }
      this._cache.set(key, data);
    }
  }

  public _remove(threadId: string, userId: string): void {
    const key = `${threadId}:${userId}`;
    this._cache.delete(key);
  }

  public get(threadId: string, userId: string): ThreadMemberStructureInstance | undefined {
    const key = `${threadId}:${userId}`;
    return this._cache.get(key);
  }

  public async fetch(
    threadId: string,
    options?: { withMember?: boolean; cache?: { force: boolean } },
  ): Promise<ThreadMemberStructureInstance[]> {
    const cached: ThreadMemberStructureInstance[] = [];

    if (!options?.cache?.force) {
      for (const member of this._cache.values()) {
        if (member.threadId === threadId) {
          cached.push(member);
        }
      }

      if (cached.length > 0) {
        return cached;
      }
    }

    const query = new URLSearchParams();
    if (options?.withMember) {
      query.set("with_member", "true");
    }

    const members = (await this.client.rest.get(
      `/channels/${threadId}/thread-members?${query.toString()}`,
    )) as (APIThreadMember & { guild_id: string })[] | null;

    if (!members) {
      return cached;
    }

    return members.map((member) => {
      const memberStructure = new ThreadMemberStructure(
        member,
        threadId,
        member.guild_id,
        this.client,
      );
      this._add(memberStructure, { enabled: true, force: false });
      return memberStructure;
    });
  }

  public async add(threadId: string, userId: string): Promise<void> {
    await this.client.rest.put(Routes.threadMembers(threadId, userId));
  }

  public async remove(threadId: string, userId: string): Promise<void> {
    await this.client.rest.delete(Routes.threadMembers(threadId, userId));
    this._remove(threadId, userId);
  }

  public get cache(): Cache<string, ThreadMemberStructureInstance> {
    return this._cache;
  }
}
