interface RESTClient {
  restRequestTimeout: number;
  token?: string;
  version: number;
}

interface RequestOptions extends RequestInit {
  query?: Record<string, string | string[]>;
  reason?: string;
  headers?: Record<string, string>;
  // biome-ignore lint/suspicious/noExplicitAny: false
  body?: any;
  throwError?: boolean;
}

class REST {
  private token?: string;

  constructor(private client: RESTClient) {}

  setToken(token: string) {
    this.token = token;
    return this;
  }

  private async _make<T>(defaultUrl: string, options: RequestOptions = {}): Promise<T | null> {
    let url = defaultUrl;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.client.restRequestTimeout);

    const headers: Record<string, string> = {
      Authorization: options.headers?.Authorization || `${this.token ?? this.client.token}`,
    };

    if (options.reason) {
      headers["X-Audit-Log-Reason"] = options.reason;
    }

    // biome-ignore lint/suspicious/noExplicitAny: false
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
      url += `?${queryParams.toString()}`;
    }

    const response = await fetch(`${this.root}${url}`, {
      method: options.method,
      headers,
      body,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (options.throwError !== false) {
        throw new Error(
          `Request failed with status ${response.status}: ${(errorData as Error)?.message || response.statusText}`,
        );
      }
      return errorData as T;
    }

    return response.status !== 204 ? ((await response.json().catch(() => null)) as T) : null;
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
}

export default REST;
