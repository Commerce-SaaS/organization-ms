import { Inject, Injectable } from '@nestjs/common';
import { CreateUserOrganizationDto } from './dto/create-user_organization.dto';
import { UpdateUserOrganizationDto } from './dto/update-user_organization.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserOrganization } from './entities/user_organization.entity';
import { Repository } from 'typeorm';
import { RpcExceptionHelper } from 'src/common/helpers/rpc-exception.helper';
import { Organization } from 'src/organization/entities/organization.entity';
import Redis from 'ioredis';
import { UserAuthzRefreshDto } from './dto/user_authz_refresh_event.dto';
import { UserAuthzRefreshReason } from './enums/user_authz_refresh_reason.enum';
import { OrganizationRole } from './enums/organization-roles.enum';

@Injectable()
export class UserOrganizationService {
  constructor(
    @InjectRepository(UserOrganization)
    private readonly userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async create(createUserOrganizationDto: CreateUserOrganizationDto) {
    const { organizationId, userId, role } = createUserOrganizationDto;

    await this.verifyOrganizationExist(organizationId);
    try {
      const userOrganization = this.userOrganizationRepository.create({
        organization: { id: organizationId },
        userId: userId,
        role,
      });

      const saved =
        await this.userOrganizationRepository.save(userOrganization);
      await this.rebuildUserOrgs(userId);

      return saved;
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  async update(
    id: string,
    updateUserOrganizationDto: UpdateUserOrganizationDto,
  ) {
    try {
      const entityToUpdate = await this.userOrganizationRepository.preload({
        ...updateUserOrganizationDto,
        id,
      });

      if (!entityToUpdate) {
        RpcExceptionHelper.badRequestException(
          `UserOrganization with id: ${id} not found`,
        );
      }

      const saved = await this.userOrganizationRepository.save(entityToUpdate);
      await this.rebuildUserOrgs(entityToUpdate.userId);
      return saved;
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  async remove(id: string) {
    try {
      const userOrganization = await this.userOrganizationRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!userOrganization)
        RpcExceptionHelper.badRequestException(`User with id: ${id} not found`);

      if (userOrganization.deletedAt) {
        RpcExceptionHelper.badRequestException(
          `UserOrganization with id: ${id} already soft deleted`,
        );
      }

      await this.userOrganizationRepository.softDelete(id);
      await this.rebuildUserOrgs(userOrganization.userId);
      return { message: `UserOrganization with id: ${id} was soft deleted` };
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  async findOrganizationsByUser(id: string) {
    try {
      const res = await this.userOrganizationRepository.find({
        where: { userId: id },
        relations: ['organization'],
      });

      return this.transformOrganizationStructure(res);
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  async findUsersByOrganization(id: string) {
    await this.verifyOrganizationExist(id);
    try {
      const res = await this.userOrganizationRepository.find({
        where: { organization: { id } },
      });
      return this.transformUserStructure(res);
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  async handleUserAuthzRefresh(data: UserAuthzRefreshDto) {
    const { userId, reason, organizationId } = data;

    if (
      reason === UserAuthzRefreshReason.REGISTER_CUSTOMER ||
      reason === UserAuthzRefreshReason.REGISTER_CUSTOMER_OAUTH
    ) {
      await this.create({
        organizationId,
        role: OrganizationRole.CUSTOMER,
        userId,
      });
    }

    return this.rebuildUserOrgs(userId);
  }

  async restoreUserOrganization(id: string) {
    try {
      const userOrganization = await this.userOrganizationRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!userOrganization) {
        RpcExceptionHelper.notFound('User_Organization');
      }

      if (!userOrganization.deletedAt) {
        RpcExceptionHelper.badRequestException(
          `User_Organization with id: ${id} is already active`,
        );
      }

      await this.userOrganizationRepository.restore(id);
      await this.rebuildUserOrgs(userOrganization.userId);
      return { message: `UserOrganization with id: ${id} was restored` };
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  private async verifyOrganizationExist(organizationId: string) {
    const organizationExists = await this.organizationRepo.findOne({
      where: { id: organizationId },
    });
    if (!organizationExists) {
      throw RpcExceptionHelper.notFound('Organization');
    }
  }

  private async rebuildUserOrgs(userId: string) {
    const orgs = await this.userOrganizationRepository.find({
      where: { userId },
      select: ['organization', 'role'],
      relations: ['organization'],
    });
    const list = orgs.map((o) => ({
      organizationId: o.organization.id,
      role: o.role,
      email: o.organization.contactEmail,
      stripeAccountId: o.organization.stripeAccountId,
    }));
    await this.redis.set(
      `user:${userId}:orgs`,
      JSON.stringify(list),
      'EX',
      3600,
    );
    return list;
  }

  private transformUserStructure(userOrganizations: any) {
    return userOrganizations.map((uo) => ({
      membershipId: uo.id,
      userId: uo.userId,
      role: uo.role,
    }));
  }

  private transformOrganizationStructure(userOrganizations: any) {
    return userOrganizations.map((uo) => ({
      membershipId: uo.id,
      role: uo.role,
      organization: {
        id: uo.organization.id,
        name: uo.organization.name,
        address: uo.organization.address,
        logoUrl: uo.organization.logoUrl,
        contactEmail: uo.organization.contactEmail,
        contactPhone: uo.organization.contactPhone,
      },
    }));
  }
}
