import { IsUUID, IsEnum } from 'class-validator';
import { OrganizationRole } from '../enums/organization-roles.enum';

export class CreateUserOrganizationDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  organizationId: string;

  @IsEnum(OrganizationRole)
  role: OrganizationRole;
}
