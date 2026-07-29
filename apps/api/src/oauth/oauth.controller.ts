import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { OAuthCallbackExchangeDto } from './dto/oauth-callback-exchange.dto';
import {
  getGoogleOAuthConfig,
  toGoogleOAuthUnavailable,
} from './google-oauth.config';
import { OAuthService } from './oauth.service';
import { OAuthProfile } from './types/oauth-profile.type';

type OAuthCallbackRequest = Request & {
  user?: OAuthProfile;
};

@Public()
@Controller('auth')
export class OAuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('google')
  async start(
    @Query('clientId') clientId: string,
    @Query('redirectUri') redirectUri: string,
    @Res() response: Response,
  ): Promise<void> {
    const state = await this.oauthService.createState({
      clientId,
      redirectUri,
    });
    const googleOAuthConfig = (() => {
      try {
        return getGoogleOAuthConfig(this.configService);
      } catch (error) {
        toGoogleOAuthUnavailable(error);
      }
    })();
    const googleAuthUrl = new URL(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    googleAuthUrl.searchParams.set('client_id', googleOAuthConfig.clientId);
    googleAuthUrl.searchParams.set(
      'redirect_uri',
      googleOAuthConfig.callbackUrl,
    );
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('state', state);

    response.redirect(googleAuthUrl.toString());
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async callback(
    @Req() request: OAuthCallbackRequest,
    @Query('state') state: string,
    @Res() response: Response,
  ): Promise<void> {
    if (!request.user) {
      response.redirect('/signin?error=oauth_failed');
      return;
    }

    const result = await this.oauthService.completeGoogleLogin({
      state,
      profile: request.user,
    });
    const callbackUrl = new URL(result.redirectUri);
    callbackUrl.searchParams.set('code', result.code);
    response.redirect(callbackUrl.toString());
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('oauth/exchange')
  exchange(@Body() dto: OAuthCallbackExchangeDto) {
    return this.oauthService.exchangeCallbackCode(dto);
  }
}
