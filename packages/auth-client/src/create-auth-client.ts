import type {
  OAuthExchangeInput,
  RefreshInput,
  SignInInput,
  SignOutInput,
  SignUpInput,
  VAuthTokenResponse,
} from "./types.js";

type CreateAuthClientOptions = {
  apiUrl: string;
  clientId: string;
  fetchImpl?: typeof fetch;
};

export class VAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "VAuthError";
  }
}

export function createAuthClient(options: CreateAuthClientOptions) {
  const fetcher = options.fetchImpl ?? fetch;
  const apiUrl = options.apiUrl.replace(/\/$/, "");

  async function post<TResponse>(
    path: string,
    body: unknown,
  ): Promise<TResponse> {
    const response = await fetcher(`${apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new VAuthError("VAuth request failed.", response.status);
    }

    return response.json() as Promise<TResponse>;
  }

  return {
    signUp(input: SignUpInput): Promise<VAuthTokenResponse> {
      return post("/auth/signup", { ...input, clientId: options.clientId });
    },
    signIn(input: SignInInput): Promise<VAuthTokenResponse> {
      return post("/auth/signin", { ...input, clientId: options.clientId });
    },
    refresh(input: RefreshInput): Promise<VAuthTokenResponse> {
      return post("/auth/refresh", input);
    },
    signOut(input: SignOutInput): Promise<{ signedOut: true }> {
      return post("/auth/signout", input);
    },
    exchangeOAuthCode(input: OAuthExchangeInput): Promise<VAuthTokenResponse> {
      return post("/auth/oauth/exchange", {
        ...input,
        clientId: options.clientId,
      });
    },
    me(accessToken: string) {
      return fetcher(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
  };
}
