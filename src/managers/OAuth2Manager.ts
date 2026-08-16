import type {
  RESTGetAPIOAuth2CurrentApplicationResult,
  RESTGetAPIOAuth2CurrentAuthorizationResult,
  RESTOAuth2AdvancedBotAuthorizationQuery,
  RESTOAuth2AuthorizationQuery,
  RESTOAuth2BotAuthorizationQuery,
  RESTOAuth2ImplicitAuthorizationQuery,
  RESTPostOAuth2AccessTokenResult,
  RESTPostOAuth2AccessTokenURLEncodedData,
  RESTPostOAuth2ClientCredentialsResult,
  RESTPostOAuth2ClientCredentialsURLEncodedData,
  RESTPostOAuth2RefreshTokenResult,
  RESTPostOAuth2RefreshTokenURLEncodedData,
  RESTPostOAuth2TokenRevocationQuery,
} from "discord-api-types/v10";
import type Client from "../client";
import { OAuth2Routes, Routes } from "../utils/constants";

/**
 * REST-backed helpers for Discord OAuth2 flows.
 */
export default class OAuth2Manager {
  public readonly client: Client;

  /**
   * @param client - The client used to perform OAuth2 requests.
   */
  public constructor(client: Client) {
    this.client = client;
  }

  /**
   * Builds an OAuth2 authorization URL from official Discord query fields.
   * @param query - The authorization query.
   * @returns A URL that can be opened by the authorizing user.
   */
  public createAuthorizationURL(query: RESTOAuth2AuthorizationQuery): string {
    return this.createAuthorizationURLFromQuery(query);
  }

  /**
   * Builds an OAuth2 implicit-grant authorization URL.
   * @param query - The official implicit-grant authorization query.
   * @returns A URL that can be opened by the authorizing user.
   */
  public createImplicitAuthorizationURL(query: RESTOAuth2ImplicitAuthorizationQuery): string {
    return this.createAuthorizationURLFromQuery(query);
  }

  /**
   * Builds a bot-install authorization URL.
   * @param query - The official bot authorization query.
   * @returns A URL that can be opened by the authorizing user.
   */
  public createBotAuthorizationURL(query: RESTOAuth2BotAuthorizationQuery): string {
    return this.createAuthorizationURLFromQuery(query);
  }

  /**
   * Builds an advanced bot-install authorization URL.
   * @param query - The official advanced bot authorization query.
   * @returns A URL that can be opened by the authorizing user.
   */
  public createAdvancedBotAuthorizationURL(query: RESTOAuth2AdvancedBotAuthorizationQuery): string {
    return this.createAuthorizationURLFromQuery(query);
  }

  private createAuthorizationURLFromQuery(query: object): string {
    const url = new URL(OAuth2Routes.authorizationURL);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  /**
   * Fetches the application associated with an OAuth2 access token.
   * @param accessToken - The OAuth2 bearer token.
   */
  public async fetchCurrentApplication(
    accessToken: string,
  ): Promise<RESTGetAPIOAuth2CurrentApplicationResult | null> {
    return (await this.client.rest.get(Routes.oauth2CurrentApplication(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })) as RESTGetAPIOAuth2CurrentApplicationResult | null;
  }

  /**
   * Fetches the authorization information associated with an OAuth2 access token.
   * @param accessToken - The OAuth2 bearer token.
   */
  public async fetchCurrentAuthorization(
    accessToken: string,
  ): Promise<RESTGetAPIOAuth2CurrentAuthorizationResult | null> {
    return (await this.client.rest.get(Routes.oauth2CurrentAuthorization(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })) as RESTGetAPIOAuth2CurrentAuthorizationResult | null;
  }

  /**
   * Exchanges an authorization code for an OAuth2 token.
   * @param data - The official authorization-code form fields.
   */
  public async exchangeCode(
    data: RESTPostOAuth2AccessTokenURLEncodedData,
  ): Promise<RESTPostOAuth2AccessTokenResult | null> {
    return this.tokenRequest(data);
  }

  /**
   * Exchanges a refresh token for a new OAuth2 token.
   * @param data - The official refresh-token form fields.
   */
  public async refreshToken(
    data: RESTPostOAuth2RefreshTokenURLEncodedData,
  ): Promise<RESTPostOAuth2RefreshTokenResult | null> {
    return this.tokenRequest(data);
  }

  /**
   * Exchanges client credentials for an OAuth2 token.
   * @param data - The official client-credentials form fields.
   * @param clientId - Optional client ID for HTTP Basic authentication.
   * @param clientSecret - Optional client secret for HTTP Basic authentication.
   */
  public async clientCredentials(
    data: RESTPostOAuth2ClientCredentialsURLEncodedData,
    clientId?: string,
    clientSecret?: string,
  ): Promise<RESTPostOAuth2ClientCredentialsResult | null> {
    return (await this.client.rest.post(Routes.oauth2TokenExchange(), {
      body: this.toFormData(data),
      headers: this.basicAuthHeaders(clientId, clientSecret),
    })) as RESTPostOAuth2ClientCredentialsResult | null;
  }

  /**
   * Revokes an OAuth2 access or refresh token.
   * @param data - The official revocation form fields.
   * @param clientId - Optional client ID for HTTP Basic authentication.
   * @param clientSecret - Optional client secret for HTTP Basic authentication.
   */
  public async revokeToken(
    data: RESTPostOAuth2TokenRevocationQuery,
    clientId?: string,
    clientSecret?: string,
  ): Promise<void> {
    await this.client.rest.post(Routes.oauth2TokenRevocation(), {
      body: this.toFormData(data),
      headers: this.basicAuthHeaders(clientId, clientSecret),
    });
  }

  /**
   * Exchanges one of Discord's official OAuth2 token request bodies.
   */
  private async tokenRequest<T extends RESTPostOAuth2AccessTokenResult>(
    data: RESTPostOAuth2AccessTokenURLEncodedData | RESTPostOAuth2RefreshTokenURLEncodedData,
  ): Promise<T | null> {
    return (await this.client.rest.post(Routes.oauth2TokenExchange(), {
      body: this.toFormData(data),
      headers: this.basicAuthHeaders(
        "client_id" in data ? data.client_id : undefined,
        "client_secret" in data ? data.client_secret : undefined,
      ),
    })) as T | null;
  }

  private toFormData(data: object): URLSearchParams {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        body.set(key, String(value));
      }
    }
    return body;
  }

  private basicAuthHeaders(clientId?: string, clientSecret?: string): Record<string, string> {
    if (!clientId || !clientSecret) {
      return {};
    }
    return {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    };
  }
}
