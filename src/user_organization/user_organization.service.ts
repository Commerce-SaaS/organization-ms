import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(UserOrganizationService.name);

  constructor(
    @InjectRepository(UserOrganization)
    private readonly userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) { }

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
      this.logger.log(
        `[AUTHZ-FLOW] create: membership created membershipId=${saved.id} userId=${userId} organizationId=${organizationId}`,
      );
      await this.rebuildUserOrgs(userId);

      return saved;
    } catch (error) {
      this.logger.error(
        `[AUTHZ-FLOW] create: failed to create membership userId=${userId} organizationId=${organizationId}: ${error?.message}`,
      );
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

    this.logger.log(
      `[AUTHZ-FLOW] handleUserAuthzRefresh: userId=${userId} organizationId=${organizationId} reason=${reason}`,
    );

    if (
      reason === UserAuthzRefreshReason.REGISTER_CUSTOMER ||
      reason === UserAuthzRefreshReason.REGISTER_CUSTOMER_OAUTH
    ) {
      this.logger.log(
        `[AUTHZ-FLOW] handleUserAuthzRefresh: reason=${reason} → creating membership userId=${userId} organizationId=${organizationId}`,
      );
      await this.create({
        organizationId,
        role: OrganizationRole.CUSTOMER,
        userId,
      });
    } else {
      this.logger.log(
        `[AUTHZ-FLOW] handleUserAuthzRefresh: reason=${reason} → skipping membership creation, rebuilding cache only`,
      );
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

    this.logger.log(
      `[AUTHZ-FLOW] rebuildUserOrgs: userId=${userId} orgCount=${list.length} cacheKey=user:${userId}:orgs TTL=3600s`,
    );
    if (list.length === 0) {
      this.logger.warn(
        `[AUTHZ-FLOW] rebuildUserOrgs: WARN userId=${userId} has 0 orgs in cache — OrganizationGuard will return 401`,
      );
    }
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

  // Called when auth-ms emits customer.anonymized.
  // Soft-deletes all membership rows for the user and immediately drops the
  // Redis org-list cache so the next auth check doesn't see stale data.
  // TypeORM's softDelete() only touches rows where deletedAt IS NULL, so
  // calling this twice is naturally idempotent.
  async anonymizeCustomerMemberships(userId: string): Promise<void> {
    this.logger.log(`customer.anonymized RECEIVED for userId=${userId}`);
    try {
      const result = await this.userOrganizationRepository.softDelete({ userId });
      const affected = result.affected ?? 0;

      if (affected === 0) {
        // Puede ser legítimo: evento duplicado (ya estaba soft-deleted) o
        // el user nunca tuvo membresías. No es un error, pero conviene verlo.
        this.logger.warn(
          `customer.anonymized: 0 memberships soft-deleted for userId=${userId} ` +
          `(already anonymized, or user had no memberships)`,
        );
      } else {
        this.logger.log(
          `customer.anonymized: soft-deleted ${affected} membership(s) for userId=${userId}`,
        );
      }

      const redisKey = `user:${userId}:orgs`;
      const deletedKeys = await this.redis.del(redisKey);
      this.logger.log(
        `customer.anonymized: redis del "${redisKey}" removed ${deletedKeys} key(s) ` +
        `(1 = cache existed and was cleared, 0 = no cache present)`,
      );

      this.logger.log(`customer.anonymized DONE for userId=${userId}`);
    } catch (error) {
      // Importante: logueamos pero no relanzamos sin pensar — si esto corre
      // dentro de un @EventPattern, un throw puede hacer que el mensaje se
      // reintente/quede sin ack. Confirmá el comportamiento de ack en tu controller.
      this.logger.error(
        `customer.anonymized FAILED for userId=${userId}: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }
}
