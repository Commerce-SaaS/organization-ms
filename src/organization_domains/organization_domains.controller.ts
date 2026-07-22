import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrganizationDomainsService } from './organization_domains.service';
import { CreateOrganizationDomainDto } from './dto/create-organization_domain.dto';
import { UpdateOrganizationDomainDto } from './dto/update-organization_domain.dto';
import { ORGANIZATION_DOMAIN_PATTERNS } from './patterns/organization_domain_patterns';

@Controller()
export class OrganizationDomainsController {
  constructor(
    private readonly organizationDomainsService: OrganizationDomainsService,
  ) {}

  @MessagePattern(ORGANIZATION_DOMAIN_PATTERNS.CREATE)
  create(@Payload() createOrganizationDomainDto: CreateOrganizationDomainDto) {
    return this.organizationDomainsService.create(createOrganizationDomainDto);
  }

  @MessagePattern(ORGANIZATION_DOMAIN_PATTERNS.FIND_ALL)
  findAll(@Payload() payload: { organizationId: string }) {
    return this.organizationDomainsService.findAll(payload.organizationId);
  }
  @MessagePattern(ORGANIZATION_DOMAIN_PATTERNS.FIND_ONE)
  findOne(@Payload() dto: { id: string }) {
    return this.organizationDomainsService.findOne(dto.id);
  }

  @MessagePattern(ORGANIZATION_DOMAIN_PATTERNS.UPDATE)
  update(@Payload() updateOrganizationDomainDto: UpdateOrganizationDomainDto) {
    return this.organizationDomainsService.update(updateOrganizationDomainDto);
  }

  @MessagePattern(ORGANIZATION_DOMAIN_PATTERNS.DELETE)
  remove(@Payload() dto: { id: string }) {
    return this.organizationDomainsService.remove(dto.id);
  }
}
