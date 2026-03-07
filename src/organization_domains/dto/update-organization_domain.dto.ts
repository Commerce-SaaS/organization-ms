import { IsOptional, IsString, MaxLength, IsBoolean, IsUUID } from "class-validator";

export class UpdateOrganizationDomainDto {
  @IsUUID()
  id: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;
}