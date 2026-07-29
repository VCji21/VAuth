import { IsBoolean, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9_-]+$/)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}
