import type { RESTError } from "discord-api-types/v10";

/**
 * Error thrown when Discord rejects a REST request.
 *
 * The nested error payload is kept exactly as returned by Discord so callers
 * can inspect field-level validation details without parsing an error string.
 */
export default class DiscordAPIError extends Error {
  /** The HTTP status returned by Discord. */
  public readonly status: number;
  /** The Discord JSON error code, when supplied. */
  public readonly code?: number;
  /** The official nested validation details, when supplied. */
  public readonly errors?: RESTError["errors"];
  /** The HTTP method used by the request. */
  public readonly method: string;
  /** The API-relative route used by the request. */
  public readonly path: string;
  /** The complete official error response. */
  public readonly payload: RESTError;

  /**
   * @param payload - The official Discord REST error payload.
   * @param status - The HTTP status code.
   * @param method - The HTTP method used by the request.
   * @param path - The API-relative route used by the request.
   */
  public constructor(payload: RESTError, status: number, method: string, path: string) {
    super(`${payload.message} (${status})`);
    this.name = "DiscordAPIError";
    this.status = status;
    this.code = payload.code;
    this.errors = payload.errors;
    this.method = method;
    this.path = path;
    this.payload = payload;
  }
}
