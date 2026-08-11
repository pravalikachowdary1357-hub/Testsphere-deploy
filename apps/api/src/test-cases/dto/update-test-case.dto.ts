import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import {
  TEST_CASE_PRIORITIES,
  TEST_CASE_RISKS,
  TEST_CASE_STATUSES,
  TEST_CASE_TYPES,
} from './create-test-case.dto';

export class UpdateTestCaseDto {
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
