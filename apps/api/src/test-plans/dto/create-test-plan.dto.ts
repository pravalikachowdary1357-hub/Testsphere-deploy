import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const TEST_PLAN_STATUSES = [
  'Draft',
  'Pending Approval',
  'Approved',
  'In Progress',
  'Completed',
  'Rejected',
] as const;

export class CreateTestPlanDto {
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
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  strategy?: string;

  @IsOptional()
  @IsString()
  entryCriteria?: string;

  @IsOptional()
  @IsString()
  exitCriteria?: string;

  @IsOptional()
  @IsString()
  environment?: string;

  @IsOptional()
  @IsString()
  releaseVersion?: string;

  @IsOptional()
  @IsIn(TEST_PLAN_STATUSES)
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
