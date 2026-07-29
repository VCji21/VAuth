export type AccessTokenPayload = {
  sub: string;
  email: string;
  appId: string;
  clientId: string;
  roles: string[];
  permissions: string[];
  typ: 'access';
};
