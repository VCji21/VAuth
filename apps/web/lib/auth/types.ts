export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type WebSession = {
  user: SessionUser;
  clientId: string;
  appId: string;
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: SessionUser;
  app: {
    id: string;
    clientId: string;
  };
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
};

export type ActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};
