import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TEST_SUITE_STATUSES, TEST_SUITE_TYPES } from './create-test-suite.dto';

export class UpdateTestSuiteDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

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
