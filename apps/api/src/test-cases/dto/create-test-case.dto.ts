import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const TEST_CASE_TYPES = [
  'Functional',
  'Regression',
  'Smoke',
  'Integration',
  'Performance',
  'Security',
  'Usability',
] as const;

export const TEST_CASE_PRIORITIES = [
  'Critical',
  'High',
  'Medium',
  'Low',
] as const;

export const TEST_CASE_RISKS = ['High', 'Medium', 'Low'] as const;

export const TEST_CASE_STATUSES = [
  'Draft',
  'Ready for Review',
  'Approved',
  'Deprecated',
] as const;

export class CreateTestCaseDto {
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
  preconditions?: string;

  @IsOptional()
  @IsString()
  steps?: string;

  @IsOptional()
  @IsString()
  expectedResult?: string;

  @IsOptional()
  @IsString()
  testData?: string;

  @IsOptional()
  @IsIn(TEST_CASE_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(TEST_CASE_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsIn(TEST_CASE_RISKS)
  risk?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsIn(TEST_CASE_STATUSES)
  status?: string;
}
