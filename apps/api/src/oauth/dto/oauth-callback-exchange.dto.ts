import { IsString, IsUrl } from 'class-validator';

export class OAuthCallbackExchangeDto {
  @IsString()
  clientId!: string;

  @IsString()
  code!: string;

  @IsUrl({ require_tld: false })
  redirectUri!: string;
}
