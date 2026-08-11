import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const TEST_EXECUTION_RESULTS = [
  'Not Run',
  'Pass',
  'Fail',
  'Blocked',
  'Retest',
] as const;

export class CreateTestExecutionDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  projectId: string;

  @IsString()
  testCaseId: string;

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
