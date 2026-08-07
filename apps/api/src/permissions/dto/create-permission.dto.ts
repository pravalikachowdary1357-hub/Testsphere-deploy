import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @Matches(/^[a-z]+:[a-z]+$/, {
    message: 'key must be in the form "resource:action" (e.g. "user:create")',
  })
  key: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;
}
