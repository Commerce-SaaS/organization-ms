import { IsString, IsUUID } from 'class-validator';
import { OrganizationRole } from '../enums/organization-roles.enum';

export class UpdateUserOrganizationDto {
  @IsUUID()
  id: string;
  
  @IsString()
  role: OrganizationRole;
}
