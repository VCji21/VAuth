import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

const requiredGoogleOAuthKeys = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
] as const;

const placeholderPrefixes = [
  'replace-',
  'missing-',
  'your-',
  'example-',
  'placeholder-',
];

export class GoogleOAuthConfigError extends Error {
  constructor(missingKeys: string[]) {
    super(
      `Google OAuth is not configured. Set ${missingKeys.join(', ')} before enabling Google login.`,
    );
    this.name = 'GoogleOAuthConfigError';
  }
}

export function getGoogleOAuthConfig(
  configService: ConfigService,
): GoogleOAuthConfig {
  const values = {
    GOOGLE_CLIENT_ID: configService.get<string>('GOOGLE_CLIENT_ID')?.trim(),
    GOOGLE_CLIENT_SECRET: configService
      .get<string>('GOOGLE_CLIENT_SECRET')
      ?.trim(),
    GOOGLE_CALLBACK_URL: configService
      .get<string>('GOOGLE_CALLBACK_URL')
      ?.trim(),
  };

  const missingKeys = requiredGoogleOAuthKeys.filter((key) =>
    isMissingOrPlaceholder(values[key]),
  );

  if (missingKeys.length > 0) {
    throw new GoogleOAuthConfigError([...missingKeys]);
  }

  return {
    clientId: values.GOOGLE_CLIENT_ID as string,
    clientSecret: values.GOOGLE_CLIENT_SECRET as string,
    callbackUrl: values.GOOGLE_CALLBACK_URL as string,
  };
}

export function toGoogleOAuthUnavailable(error: unknown): never {
  if (error instanceof GoogleOAuthConfigError) {
    throw new ServiceUnavailableException(error.message);
  }

  throw error;
}

function isMissingOrPlaceholder(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  const normalized = value.toLowerCase();
  return placeholderPrefixes.some((prefix) => normalized.startsWith(prefix));
}
