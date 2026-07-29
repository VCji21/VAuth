import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

type OAuthStatePayload = {
  clientId: string;
  redirectUri: string;
  typ: 'oauth_state';
};

@Injectable()
export class OAuthStateService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  sign(input: { clientId: string; redirectUri: string }): Promise<string> {
    return this.jwtService.signAsync(
      {
        clientId: input.clientId,
        redirectUri: input.redirectUri,
        typ: 'oauth_state',
      } satisfies OAuthStatePayload,
      {
        secret: this.configService.get<string>('OAUTH_STATE_SECRET')
          ?? this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '10m',
      },
    );
  }

  async verify(state: string): Promise<OAuthStatePayload> {
    const payload = await this.jwtService.verifyAsync<OAuthStatePayload>(state, {
      secret: this.configService.get<string>('OAUTH_STATE_SECRET')
        ?? this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
    if (payload.typ !== 'oauth_state') {
      throw new BadRequestException('Invalid OAuth state');
    }
    return payload;
  }
}
