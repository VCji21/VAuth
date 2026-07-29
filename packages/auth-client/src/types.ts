export type VAuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type VAuthTokenResponse = {
  user: VAuthUser;
  app: {
    id: string;
    clientId: string;
  };
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type RefreshInput = {
  refreshToken: string;
};

export type SignOutInput = {
  refreshToken: string;
  allSessions?: boolean;
};

export type OAuthExchangeInput = {
  code: string;
  redirectUri: string;
};
