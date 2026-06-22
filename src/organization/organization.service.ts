import { Injectable, Logger } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { RpcExceptionHelper } from 'src/common/helpers/rpc-exception.helper';
import { UserOrganizationService } from 'src/user_organization/user_organization.service';
import { OrganizationRole } from 'src/user_organization/enums/organization-roles.enum';
import { UserAuthzRefreshReason } from 'src/user_organization/enums/user_authz_refresh_reason.enum';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly userOrganizationService: UserOrganizationService,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    const { name, ownerId } = createOrganizationDto;

    try {
      // 1# Check if organization already exists
      const exists = await this.organizationRepository.findOne({
        where: { name: name.toLowerCase(), ownerId },
      });

      // 2# If exists, throw an error
      if (exists) {
        RpcExceptionHelper.duplicate('Organization');
      }

      // 3# If not, create a new organization
      const normalizedName = name.toLowerCase().trim();
      const newOrganization = await this.organizationRepository.save({
        ...createOrganizationDto,
        name: normalizedName,
      });
      // 4# Create membership
      if (newOrganization) {
        await this.userOrganizationService.create({
          organizationId: newOrganization.id,
          userId: ownerId,
          role: OrganizationRole.STAFF,
        });

        await this.userOrganizationService.handleUserAuthzRefresh({
          userId: ownerId,
          organizationId: newOrganization.id,
          reason: UserAuthzRefreshReason.ORGANIZATION_CREATED,
        });
      }

      return newOrganization;
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  async findOne(id: string) {
    try {
      const organization = await this.organizationRepository.findOneBy({ id });

      if (!organization) {
        RpcExceptionHelper.notFound('Organization');
      }

      return organization;
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    try {
      // 1# Verify if organization exists
      const organizationUpdated = await this.organizationRepository.preload({
        ...updateOrganizationDto,
        id,
      });
      if (!organizationUpdated) {
        RpcExceptionHelper.badRequestException(
          `Organization with id: ${id} not found`,
        );
      }
      // 2# Save to DB
      await this.organizationRepository.save(organizationUpdated);

      // 3# Return updated organization
      return organizationUpdated;
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  // OrganizationService
  async clearStripeAccount(stripeAccountId: string) {
    this.logger.log(
      `Clearing stripeAccountId=${stripeAccountId} from organization`,
    );

    const organization = await this.organizationRepository.findOne({
      where: { stripeAccountId },
    });

    if (!organization) {
      this.logger.warn(
        `clearStripeAccount: no organization found with stripeAccountId=${stripeAccountId}`,
      );
      return { ignored: true };
    }

    await this.organizationRepository.update(organization.id, {
      stripeAccountId: null,
    });

    this.logger.log(
      `Cleared stripeAccountId from organization=${organization.id}`,
    );

    return { cleared: true };
  }

  async softDelete(id: string) {
    try {
      // 1# Verify if organization exists
      const organization = await this.organizationRepository.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!organization) {
        RpcExceptionHelper.notFound('Organization');
      }

      if (organization.deletedAt) {
        RpcExceptionHelper.badRequestException(
          `Organization with id: ${id} already soft deleted`,
        );
      }

      // 2# Soft delete
      await this.organizationRepository.softDelete(id);
      return { message: `Organization with id: ${id} soft deleted` };
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }
}
