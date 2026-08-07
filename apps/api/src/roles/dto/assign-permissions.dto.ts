import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissionIds: string[];
}
