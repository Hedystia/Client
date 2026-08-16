import { type RESTError, type RESTRateLimit, RouteBases } from "discord-api-types/v10";
import DiscordAPIError from "../errors/RESTError";

interface RESTClient {
  restRequestTimeout: number;
  token?: string;
  version: number;
}

type QueryValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

/**
 * Options accepted by a REST request.
 */
export interface RequestOptions {
  /** HTTP method override. */
  method?: string;
  /** Query-string values. Arrays are encoded as repeated keys. */
  query?: Record<string, QueryValue>;
  /** Optional audit-log reason. */
  reason?: string;
  /** Additional request headers. */
  headers?: Record<string, string>;
  /** JSON, text, binary, or native multipart request body. */
  body?: unknown;
  /** Whether non-success responses should reject the request. */
  throwError?: boolean;
  /** Response decoding mode. */
  responseType?: "json" | "text" | "arrayBuffer";
  /** Abort signal used to cancel the request. */
  signal?: AbortSignal;
  /** Maximum number of retries for HTTP 429 responses. */
  maxRetries?: number;
}

export interface RateLimitBucket {
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  global?: boolean;
}

type RateLimitError = RESTRateLimit;

/**
 * A small REST client for Discord's official API.
 */
class REST {
  private token?: string;
  private readonly buckets: Map<string, RateLimitBucket> = new Map();
  private globalReset: number | null = null;

  /**
   * @param client - The client configuration used for authentication and timeouts.
   */
  public constructor(private readonly client: RESTClient) {}

  /**
   * Sets the token used by requests created through this REST instance.
   * @param token - A Discord bot token, with or without the `Bot ` prefix.
   * @returns This REST instance.
   */
  public setToken(token: string): this {
    this.token = token.startsWith("Bot ") ? token : `Bot ${token}`;
    return this;
  }

  /**
   * Gets the normalized bucket key for a route.
   * @param method - HTTP method.
   * @param path - API-relative path.
   */
  private getBucketKey(method: string, path: string): string {
    const normalizedPath = path
      .replace(/\/\d{17,19}/g, "/:id")
      .replace(/\/reactions\/[^/]+/, "/reactions/:id")
      .replace(/\/webhooks\/\d+\/[^/]+/, "/webhooks/:id/:token");

    return `${method}:${normalizedPath}`;
  }

  /**
   * Waits for a rate-limit delay.
   * @param resetAfter - Delay in seconds.
   */
  private async waitForRateLimit(resetAfter: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, Math.max(0, resetAfter) * 1000 + 100);
    });
  }

  /**
   * Returns whether the global rate limit is active.
   */
  private isGloballyRateLimited(): boolean {
    return this.globalReset !== null && Date.now() < this.globalReset;
  }

  /**
   * Executes one request, applying Discord's global and route rate limits.
   */
  private async executeRequest(
    url: string,
    options: RequestOptions,
    bucketKey: string,
    retryCount = 0,
  ): Promise<unknown> {
    if (this.isGloballyRateLimited() && this.globalReset) {
      await this.waitForRateLimit((this.globalReset - Date.now()) / 1000);
    }

    const bucket = this.buckets.get(bucketKey);
    if (bucket && bucket.remaining <= 0 && Date.now() < bucket.reset) {
      await this.waitForRateLimit(bucket.resetAfter);
    }

    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener("abort", abortFromCaller, { once: true });
      }
    }
    const timeout = setTimeout(() => controller.abort(), this.client.restRequestTimeout);

    const headers: Record<string, string> = {
      "User-Agent": "DiscordBot (https://github.com/Hedystia/Client, 2.1.0)",
      Authorization: options.headers?.Authorization || this.token || this.client.token || "",
    };

    if (options.reason) {
      headers["X-Audit-Log-Reason"] = options.reason;
    }

    let body: string | FormData | Blob | ArrayBuffer | Uint8Array | undefined;
    if (options.body !== undefined && options.body !== null) {
      if (typeof FormData !== "undefined" && options.body instanceof FormData) {
        body = options.body;
      } else if (typeof Blob !== "undefined" && options.body instanceof Blob) {
        body = options.body;
      } else if (options.body instanceof URLSearchParams) {
        body = options.body.toString();
        headers["Content-Type"] =
          options.headers?.["Content-Type"] || "application/x-www-form-urlencoded";
      } else if (options.body instanceof ArrayBuffer || ArrayBuffer.isView(options.body)) {
        body = options.body as ArrayBuffer | Uint8Array;
        headers["Content-Type"] = options.headers?.["Content-Type"] || "application/octet-stream";
      } else if (typeof options.body === "string") {
        body = options.body;
        headers["Content-Type"] = options.headers?.["Content-Type"] || "text/plain";
      } else {
        body = JSON.stringify(options.body);
        headers["Content-Type"] = options.headers?.["Content-Type"] || "application/json";
      }
    }

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        if (
          key !== "Content-Type" ||
          (typeof FormData !== "undefined" && !(options.body instanceof FormData))
        ) {
          headers[key] = value;
        }
      }
    }

    let requestUrl = url;
    if (options.query) {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null) {
          continue;
        }
        if (Array.isArray(value)) {
          for (const item of value) {
            queryParams.append(key, String(item));
          }
        } else {
          queryParams.append(key, String(value));
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        requestUrl += `${requestUrl.includes("?") ? "&" : "?"}${queryString}`;
      }
    }

    try {
      const response = await fetch(`${this.root}${requestUrl}`, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      });

      this.updateRateLimitInfo(response, bucketKey);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({
          code: 0,
          message: response.statusText || "Discord REST request failed",
        }))) as RESTError & Partial<RateLimitError>;

        if (response.status === 429) {
          const retryAfter = Number(errorData.retry_after ?? 1);
          if (errorData.global) {
            this.globalReset = Date.now() + retryAfter * 1000;
          }
          if (retryCount < (options.maxRetries ?? 3)) {
            await this.waitForRateLimit(retryAfter);
            return this.executeRequest(url, options, bucketKey, retryCount + 1);
          }
        }

        if (options.throwError !== false) {
          throw new DiscordAPIError(
            errorData,
            response.status,
            options.method ?? "GET",
            requestUrl,
          );
        }
        return errorData;
      }

      if (response.status === 204) {
        return null;
      }
      if (options.responseType === "arrayBuffer") {
        return response.arrayBuffer();
      }
      if (options.responseType === "text") {
        return response.text();
      }
      return await response.json().catch(() => null);
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  /**
   * Updates route and global rate-limit information from response headers.
   * @param response - The Discord response.
   * @param bucketKey - The normalized route bucket key.
   */
  private updateRateLimitInfo(response: Response, bucketKey: string): void {
    const limit = response.headers.get("X-RateLimit-Limit");
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");
    const resetAfter = response.headers.get("X-RateLimit-Reset-After");
    const bucket = response.headers.get("X-RateLimit-Bucket");
    const isGlobal = response.headers.get("X-RateLimit-Global");

    if (limit || remaining || resetAfter) {
      const bucketInfo: RateLimitBucket = {
        limit: limit ? Number.parseInt(limit, 10) : 5,
        remaining: remaining ? Number.parseInt(remaining, 10) : 4,
        reset: reset ? Number.parseFloat(reset) * 1000 : Date.now(),
        resetAfter: resetAfter ? Number.parseFloat(resetAfter) : 1,
        global: isGlobal === "true",
      };
      this.buckets.set(bucketKey, bucketInfo);
      if (bucket) {
        this.buckets.set(bucket, bucketInfo);
      }
    }

    if (isGlobal === "true") {
      const retryAfter = response.headers.get("Retry-After");
      this.globalReset = Date.now() + (retryAfter ? Number.parseFloat(retryAfter) : 1) * 1000;
    }
  }

  private async _make<T>(defaultUrl: string, options: RequestOptions = {}): Promise<T | null> {
    const method = options.method || "GET";
    const bucketKey = this.getBucketKey(method, defaultUrl);
    return this.executeRequest(defaultUrl, options, bucketKey) as Promise<T | null>;
  }

  /**
   * Sends a GET request.
   * @param url - API-relative route.
   * @param options - Request options.
   */
  public get<T>(url: string, options: RequestOptions = {}): Promise<T | null> {
    return this._make<T>(url, { method: "GET", ...options });
  }

  /**
   * Sends a POST request.
   * @param url - API-relative route.
   * @param options - Request options.
   */
  public post<T>(url: string, options: RequestOptions = {}): Promise<T | null> {
    return this._make<T>(url, { method: "POST", ...options });
  }

  /**
   * Sends a DELETE request.
   * @param url - API-relative route.
   * @param options - Request options.
   */
  public delete<T>(url: string, options: RequestOptions = {}): Promise<T | null> {
    return this._make<T>(url, { method: "DELETE", ...options });
  }

  /**
   * Sends a PUT request.
   * @param url - API-relative route.
   * @param options - Request options.
   */
  public put<T>(url: string, options: RequestOptions = {}): Promise<T | null> {
    return this._make<T>(url, { method: "PUT", ...options });
  }

  /**
   * Sends a PATCH request.
   * @param url - API-relative route.
   * @param options - Request options.
   */
  public patch<T>(url: string, options: RequestOptions = {}): Promise<T | null> {
    return this._make<T>(url, { method: "PATCH", ...options });
  }

  /**
   * The official Discord API root for this client version.
   */
  public get root(): string {
    return RouteBases.api.replace(/v10$/, `v${this.client.version}`);
  }

  /**
   * Gets the current rate-limit information for a route.
   * @param method - HTTP method.
   * @param path - API-relative route.
   */
  public getRateLimitInfo(method: string, path: string): RateLimitBucket | undefined {
    return this.buckets.get(this.getBucketKey(method, path));
  }

  /**
   * Checks whether a route is currently rate limited.
   * @param method - HTTP method.
   * @param path - API-relative route.
   */
  public isRateLimited(method: string, path: string): boolean {
    const bucket = this.buckets.get(this.getBucketKey(method, path));
    return bucket ? bucket.remaining <= 0 && Date.now() < bucket.reset : false;
  }

  /**
   * Gets the time until a route's limit resets.
   * @param method - HTTP method.
   * @param path - API-relative route.
   */
  public getTimeUntilReset(method: string, path: string): number {
    const bucket = this.buckets.get(this.getBucketKey(method, path));
    return bucket ? Math.max(0, bucket.reset - Date.now()) : 0;
  }

  /**
   * Clears all local rate-limit information.
   */
  public clearRateLimitInfo(): void {
    this.buckets.clear();
    this.globalReset = null;
  }
}

export default REST;
