interface RESTClient {
  restRequestTimeout: number;
  token?: string;
  version: number;
}

interface RequestOptions {
  method?: string;
  query?: Record<string, string | string[]>;
  reason?: string;
  headers?: Record<string, string>;
  body?: unknown;
  throwError?: boolean;
}

interface RateLimitBucket {
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  global?: boolean;
}

interface RateLimitError {
  message: string;
  retry_after: number;
  global: boolean;
  code?: number;
}

class REST {
  private token?: string;
  private buckets: Map<string, RateLimitBucket> = new Map();
  private globalReset: number | null = null;

  constructor(private client: RESTClient) {}

  setToken(token: string) {
    this.token = token;
    return this;
  }

  /**
   * Get the bucket key for a route
   * @link https://discord.com/developers/topics/rate-limits
   */
  private getBucketKey(method: string, path: string): string {
    // Normalize the path by replacing IDs with placeholders
    const normalizedPath = path
      .replace(/\/\d{17,19}/g, "/:id")
      .replace(/\/reactions\/[^/]+/, "/reactions/:id")
      .replace(/\/webhooks\/\d+\/[^/]+/, "/webhooks/:id/:token");

    return `${method}:${normalizedPath}`;
  }

  /**
   * Wait for rate limit to reset
   */
  private async waitForRateLimit(resetAfter: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, resetAfter * 1000 + 100); // Add 100ms buffer
    });
  }

  /**
   * Check if we're globally rate limited
   */
  private isGloballyRateLimited(): boolean {
    return this.globalReset !== null && Date.now() < this.globalReset;
  }

  /**
   * Execute a single request with rate limit handling
   */
  private async executeRequest(
    url: string,
    options: RequestOptions,
    bucketKey: string,
  ): Promise<unknown> {
    // Check global rate limit
    if (this.isGloballyRateLimited() && this.globalReset) {
      const waitTime = (this.globalReset - Date.now()) / 1000;
      if (waitTime > 0) {
        await this.waitForRateLimit(waitTime);
      }
    }

    // Check bucket rate limit
    const bucket = this.buckets.get(bucketKey);
    if (bucket && bucket.remaining <= 0) {
      const waitTime = bucket.resetAfter;
      if (waitTime > 0) {
        await this.waitForRateLimit(waitTime);
        // Refresh bucket info after waiting
        const freshBucket = this.buckets.get(bucketKey);
        if (freshBucket && freshBucket.remaining <= 0) {
          // Still rate limited, wait again
          return this.executeRequest(url, options, bucketKey);
        }
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.client.restRequestTimeout);

    const headers: Record<string, string> = {
      "User-Agent": "DiscordBot (https://github.com/Hedystia/Client, 0.0.1)",
      Authorization: options.headers?.Authorization || `${this.token ?? this.client.token}`,
    };

    if (options.reason) {
      headers["X-Audit-Log-Reason"] = options.reason;
    }

    // biome-ignore lint/suspicious/noExplicitAny: Body type for fetch
    let body: any;

    if (options.body) {
      if (options.body instanceof FormData) {
        body = options.body;
      } else if (options.body instanceof Buffer) {
        body = options.body;
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
        if (key !== "Content-Type" || !options.body || !(options.body instanceof FormData)) {
          headers[key] = value;
        }
      }
    }

    let requestUrl = url;
    if (options.query) {
      const queryParams = new URLSearchParams();
      for (const [key, val] of Object.entries(options.query)) {
        if (val) {
          if (Array.isArray(val)) {
            queryParams.set(key, val.join(","));
          } else {
            queryParams.append(key, val);
          }
        }
      }
      requestUrl += `?${queryParams.toString()}`;
    }

    try {
      const response = await fetch(`${this.root}${requestUrl}`, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      });

      // Update rate limit info from headers
      this.updateRateLimitInfo(response, bucketKey);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as RateLimitError;

        // Handle 429 Too Many Requests
        if (response.status === 429) {
          const retryAfter = errorData.retry_after || 1;

          if (errorData.global) {
            this.globalReset = Date.now() + retryAfter * 1000;
          }

          // Wait and retry
          await this.waitForRateLimit(retryAfter);
          return this.executeRequest(url, options, bucketKey);
        }

        if (options.throwError !== false) {
          throw new Error(
            `Request failed with status ${response.status}: ${errorData.message || response.statusText}`,
          );
        }
        return errorData;
      }

      return response.status !== 204 ? await response.json().catch(() => null) : null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Update rate limit information from response headers
   * @link https://discord.com/developers/topics/rate-limits#header-format
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

      // Use the bucket header if available for more accurate tracking
      const actualBucketKey = bucket || bucketKey;
      this.buckets.set(actualBucketKey, bucketInfo);
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

  get<T>(url: string, options: RequestOptions = {}) {
    return this._make<T>(url, { method: "GET", ...options });
  }

  post<T>(url: string, options: RequestOptions = {}) {
    return this._make<T>(url, { method: "POST", ...options });
  }

  delete<T>(url: string, options: RequestOptions = {}) {
    return this._make<T>(url, { method: "DELETE", ...options });
  }

  put<T>(url: string, options: RequestOptions = {}) {
    return this._make<T>(url, { method: "PUT", ...options });
  }

  patch<T>(url: string, options: RequestOptions = {}) {
    return this._make<T>(url, { method: "PATCH", ...options });
  }

  get root() {
    return `https://discord.com/api/v${this.client.version}`;
  }

  /**
   * Get current rate limit info for a bucket
   */
  getRateLimitInfo(method: string, path: string): RateLimitBucket | undefined {
    const bucketKey = this.getBucketKey(method, path);
    return this.buckets.get(bucketKey);
  }

  /**
   * Check if currently rate limited for a route
   */
  isRateLimited(method: string, path: string): boolean {
    const bucketKey = this.getBucketKey(method, path);
    const bucket = this.buckets.get(bucketKey);

    if (!bucket) {
      return false;
    }

    return bucket.remaining <= 0 || Date.now() < bucket.reset;
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   */
  getTimeUntilReset(method: string, path: string): number {
    const bucketKey = this.getBucketKey(method, path);
    const bucket = this.buckets.get(bucketKey);

    if (!bucket) {
      return 0;
    }

    return Math.max(0, bucket.reset - Date.now());
  }

  /**
   * Clear all rate limit info (useful for testing)
   */
  clearRateLimitInfo(): void {
    this.buckets.clear();
    this.globalReset = null;
  }
}

export default REST;
