import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ORGANIZATION_PATTERNS } from './patterns/organization_patterns';

@Controller()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @MessagePattern(ORGANIZATION_PATTERNS.CREATE)
  create(@Payload() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationService.create(createOrganizationDto);
  }

  @MessagePattern(ORGANIZATION_PATTERNS.FIND_ONE)
  findOne(@Payload() id: string) {
    return this.organizationService.findOne(id);
  }

  @MessagePattern(ORGANIZATION_PATTERNS.UPDATE)
  update(@Payload() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationService.update(
      updateOrganizationDto.id,
      updateOrganizationDto,
    );
  }

  @EventPattern(ORGANIZATION_PATTERNS.UPDATE)
  updateEvent(@Payload() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationService.update(
      updateOrganizationDto.id,
      updateOrganizationDto,
    );
  }

  @MessagePattern(ORGANIZATION_PATTERNS.DELETE)
  softDelete(@Payload() id: string) {
    return this.organizationService.softDelete(id);
  }
}
