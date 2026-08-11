import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const DEFECT_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const;

export const DEFECT_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;

export const DEFECT_STATUSES = [
  'New',
  'Assigned',
  'In Progress',
  'Retest',
  'Closed',
  'Rejected',
  'Duplicate',
  'Deferred',
  'Reopened',
  'Cannot Reproduce',
] as const;

export class CreateDefectDto {
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
  testExecutionId?: string;

  @IsOptional()
  @IsString()
  requirementId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  stepsToReproduce?: string;

  @IsOptional()
  @IsIn(DEFECT_SEVERITIES)
  severity?: string;

  @IsOptional()
  @IsIn(DEFECT_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsIn(DEFECT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  environment?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
