import { IsString, MinLength } from 'class-validator';

export class AssignOrganizationAdminDto {
  @IsString()
  @MinLength(1)
  userId: string;
}
