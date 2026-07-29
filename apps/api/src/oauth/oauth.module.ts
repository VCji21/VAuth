import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ClientsModule } from '../clients/clients.module';
import { GoogleStrategy } from './google.strategy';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { OAuthStateService } from './oauth-state.service';

@Module({
  imports: [JwtModule.register({}), AuthModule, AuditModule, ClientsModule],
  controllers: [OAuthController],
  providers: [OAuthService, OAuthStateService, GoogleStrategy],
})
export class OAuthModule {}
