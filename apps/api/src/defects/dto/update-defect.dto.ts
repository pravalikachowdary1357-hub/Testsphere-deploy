import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import {
  DEFECT_PRIORITIES,
  DEFECT_SEVERITIES,
  DEFECT_STATUSES,
} from './create-defect.dto';

export class UpdateDefectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

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
