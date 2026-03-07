import { IsUUID, IsString, IsBoolean, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class CreateOrganizationDomainDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  @MaxLength(255)
  domain: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
