import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const REQUIREMENT_TYPES = [
  'Functional',
  'Non-Functional',
  'Business',
  'Technical',
] as const;

export const REQUIREMENT_PRIORITIES = [
  'Critical',
  'High',
  'Medium',
  'Low',
] as const;

export const REQUIREMENT_STATUSES = [
  'Draft',
  'In Review',
  'Approved',
  'Rejected',
  'Deprecated',
] as const;

export class CreateRequirementDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(REQUIREMENT_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(REQUIREMENT_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsIn(REQUIREMENT_STATUSES)
  status?: string;
}
