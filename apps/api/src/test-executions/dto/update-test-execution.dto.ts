import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TEST_EXECUTION_RESULTS } from './create-test-execution.dto';

export class UpdateTestExecutionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  testCaseId?: string;

  @IsOptional()
  @IsString()
  testPlanId?: string;

  @IsOptional()
  @IsString()
  testSuiteId?: string;

  @IsOptional()
  @IsString()
  cycle?: string;

  @IsOptional()
  @IsIn(TEST_EXECUTION_RESULTS)
  result?: string;

  @IsOptional()
  @IsString()
  actualResult?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  environment?: string;

  @IsOptional()
  @IsDateString()
  executedAt?: string;
}
