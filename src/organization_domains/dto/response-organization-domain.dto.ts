export class OrganizationDomainResponseDto {
  id: string;
  organizationId: string;
  domain: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
