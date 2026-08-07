import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const ORGANIZATION_STATUSES = [
  'Active',
  'Suspended',
  'Inactive',
] as const;
export const ORGANIZATION_LICENSE_STATUSES = [
  'Trial',
  'Licensed',
  'Expired',
] as const;

export class CreateOrganizationDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  code: string;

  @IsOptional()
  @IsIn(ORGANIZATION_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(ORGANIZATION_LICENSE_STATUSES)
  licenseStatus?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  adminName?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsString()
  adminPhone?: string;
}
