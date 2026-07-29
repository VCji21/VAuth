import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, CredentialsService],
  exports: [UsersService, CredentialsService],
})
export class IdentityModule {}
