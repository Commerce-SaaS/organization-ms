import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UserOrganizationService } from './user_organization.service';
import { CreateUserOrganizationDto } from './dto/create-user_organization.dto';
import { UpdateUserOrganizationDto } from './dto/update-user_organization.dto';
import { USER_ORGANIZATION_PATTERNS } from './patterns/user_organization_patterns';
import { UserAuthzRefreshDto } from './dto/user_authz_refresh_event.dto';

@Controller()
export class UserOrganizationController {
  constructor(
    private readonly userOrganizationService: UserOrganizationService,
  ) {}

  @MessagePattern(USER_ORGANIZATION_PATTERNS.CREATE_USER_ORGANIZATION)
  create(@Payload() createUserOrganizationDto: CreateUserOrganizationDto) {
    return this.userOrganizationService.create(createUserOrganizationDto);
  }

  @MessagePattern(USER_ORGANIZATION_PATTERNS.FIND_ALL_ORGANIZATIONS_BY_USER)
  findOrganizationsByUser(@Payload() id: string) {
    return this.userOrganizationService.findOrganizationsByUser(id);
  }
  @MessagePattern(USER_ORGANIZATION_PATTERNS.FIND_ALL_USER_ORGANIZATION)
  findUsersByOrganization(@Payload() id: string) {
    return this.userOrganizationService.findUsersByOrganization(id);
  }

  @MessagePattern(USER_ORGANIZATION_PATTERNS.UPDATE_USER_ORGANIZATION)
  update(@Payload() updateUserOrganizationDto: UpdateUserOrganizationDto) {
    return this.userOrganizationService.update(
      updateUserOrganizationDto.id,
      updateUserOrganizationDto,
    );
  }

  @MessagePattern(USER_ORGANIZATION_PATTERNS.DELETE_USER_ORGANIZATION)
  remove(@Payload() id: string) {
    return this.userOrganizationService.remove(id);
  }

  @MessagePattern(USER_ORGANIZATION_PATTERNS.RESTORE_USER_ORGANIZATION)
  restore(@Payload() id: string) {
    return this.userOrganizationService.restoreUserOrganization(id);
  }

  @EventPattern(USER_ORGANIZATION_PATTERNS.USER_AUTHZ_REFRESH)
  handleUserAuthzRefresh(@Payload() data: UserAuthzRefreshDto) {
    return this.userOrganizationService.handleUserAuthzRefresh(data);
  }
}
