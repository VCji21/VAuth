import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { getGoogleOAuthConfig } from './google-oauth.config';
import { OAuthProfile } from './types/oauth-profile.type';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const googleOAuthConfig = getGoogleOAuthConfig(configService);
    super({
      clientID: googleOAuthConfig.clientId,
      clientSecret: googleOAuthConfig.clientSecret,
      callbackURL: googleOAuthConfig.callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    const rawProfile = profile._json as { email_verified?: unknown };
    const oauthProfile: OAuthProfile = {
      providerAccountId: profile.id,
      email,
      emailVerified: rawProfile.email_verified === true,
      name: profile.displayName,
    };
    done(null, oauthProfile);
  }
}
