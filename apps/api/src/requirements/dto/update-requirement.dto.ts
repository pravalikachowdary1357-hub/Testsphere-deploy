import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TYPES,
} from './create-requirement.dto';

export class UpdateRequirementDto {
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
  @IsIn(REQUIREMENT_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(REQUIREMENT_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsIn(REQUIREMENT_STATUSES)
  status?: string;
}
