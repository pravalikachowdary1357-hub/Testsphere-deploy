import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  ORGANIZATION_LICENSE_STATUSES,
  ORGANIZATION_STATUSES,
} from './create-organization.dto';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsIn(ORGANIZATION_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(ORGANIZATION_LICENSE_STATUSES)
  licenseStatus?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

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
