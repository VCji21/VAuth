import { IsOptional, IsString, Matches } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @Matches(/^[a-z0-9_-]+:[a-z0-9_-]+$/)
  action!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
