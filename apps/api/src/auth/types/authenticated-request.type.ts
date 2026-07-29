import { Request } from 'express';
import { AccessTokenPayload } from './access-token-payload.type';

export type CurrentClient = {
  appId: string;
  clientId: string;
};

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
  client?: CurrentClient;
}
