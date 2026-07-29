import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getGoogleOAuthConfig,
  GoogleOAuthConfigError,
  toGoogleOAuthUnavailable,
} from './google-oauth.config';

describe('Google OAuth config', () => {
  it('returns configured Google OAuth values', () => {
    const configService = new ConfigService({
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      GOOGLE_CALLBACK_URL: 'http://localhost:8000/auth/google/callback',
    });

    expect(getGoogleOAuthConfig(configService)).toEqual({
      clientId: 'google-client-id',
      clientSecret: 'google-client-secret',
      callbackUrl: 'http://localhost:8000/auth/google/callback',
    });
  });

  it('rejects missing or placeholder Google OAuth values', () => {
    const configService = new ConfigService({
      GOOGLE_CLIENT_ID: 'replace-with-google-client-id',
      GOOGLE_CALLBACK_URL: 'http://localhost:8000/auth/google/callback',
    });

    expect(() => getGoogleOAuthConfig(configService)).toThrow(
      GoogleOAuthConfigError,
    );
  });

  it('maps config errors to a controlled unavailable response', () => {
    const error = new GoogleOAuthConfigError(['GOOGLE_CLIENT_ID']);

    expect(() => toGoogleOAuthUnavailable(error)).toThrow(
      ServiceUnavailableException,
    );
  });
});
