import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateClientAppDto } from './create-client-app.dto';

export class UpdateClientAppDto extends PartialType(CreateClientAppDto) {
  @IsIn(['ACTIVE', 'DISABLED'])
  @IsOptional()
  status?: 'ACTIVE' | 'DISABLED';
}
