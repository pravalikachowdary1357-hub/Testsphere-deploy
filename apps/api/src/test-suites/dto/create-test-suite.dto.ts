import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const TEST_SUITE_TYPES = [
  'Regression',
  'Smoke',
  'Sanity',
  'Release',
  'Full',
] as const;

export const TEST_SUITE_STATUSES = ['Draft', 'Active', 'Archived'] as const;

export class CreateTestSuiteDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(TEST_SUITE_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(TEST_SUITE_STATUSES)
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  testCaseIds?: string[];
}
