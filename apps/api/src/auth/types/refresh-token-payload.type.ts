export type RefreshTokenPayload = {
  sub: string;
  appId: string;
  clientId: string;
  familyId: string;
  typ: 'refresh';
};
