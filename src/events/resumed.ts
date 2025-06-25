import type Client from "../client";

export default class Resumed {
  client: Client;

  constructor(client: Client) {
    this.client = client;
    this._patch();
  }

  async _patch(): Promise<void> {
    this.client.emit("resumed");
  }
}
