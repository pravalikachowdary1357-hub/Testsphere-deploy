import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

// Rows arrive as loosely-typed CSV records (string values, arbitrary headers)
// — each entity service maps and validates them against its own CreateDto.
export class BulkImportDto {
  @IsString()
  projectId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2000)
  rows: Record<string, string>[];
}

export interface BulkImportRowError {
  row: number;
  message: string;
}

export interface BulkImportResult {
  total: number;
  created: number;
  failed: number;
  errors: BulkImportRowError[];
}
