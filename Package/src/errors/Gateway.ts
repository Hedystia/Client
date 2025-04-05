export class GatewayError extends Error {
  override name = "GatewayError";

  constructor(code: number, reason: string) {
    super(`[${code}] ${reason}`);
  }
}
