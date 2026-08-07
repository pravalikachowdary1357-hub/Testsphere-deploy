import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const PRODUCT_STATUSES = ['Active', 'Deprecated', 'Retired'] as const;

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  productOwnerId?: string;
}
