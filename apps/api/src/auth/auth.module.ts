import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditModule } from '../audit/audit.module';
import { ClientsModule } from '../clients/clients.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SignInAttemptService } from './sign-in-attempt.service';
import { TokenService } from './token.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';

@Module({
  imports: [JwtModule.register({}), ClientsModule, AuditModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SignInAttemptService,
    TokenService,
    AccessTokenStrategy,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
