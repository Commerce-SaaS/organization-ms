import { Injectable } from '@nestjs/common';
import { CreateOrganizationDomainDto } from './dto/create-organization_domain.dto';
import { UpdateOrganizationDomainDto } from './dto/update-organization_domain.dto';
import { OrganizationDomain } from './entities/organization_domain.entity';
import { Repository } from 'typeorm';
import { RpcExceptionHelper } from 'src/common/helpers/rpc-exception.helper';
import { Organization } from 'src/organization/entities/organization.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrganizationDomainsService {
  constructor(
    @InjectRepository(OrganizationDomain)
    private readonly organizationDomainRepository: Repository<OrganizationDomain>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}
  async create(createOrganizationDomainDto: CreateOrganizationDomainDto) {
    const { domain, organizationId } = createOrganizationDomainDto;

    // 1. Verificar si el dominio ya existe
    const existingDomain = await this.organizationDomainRepository.findOne({
      where: { domain: domain.toLowerCase() },
    });

    if (existingDomain) {
      RpcExceptionHelper.duplicate('Domain');
    }

    // 2. Verificar si la organización existe
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      RpcExceptionHelper.notFound('Organization');
    }

    try {
      return await this.organizationDomainRepository.save({
        ...createOrganizationDomainDto,
        domain: domain.toLowerCase(),
      });
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  async findAll(organizationId: string) {
    await this.ensureOrganizationExists(organizationId);
    const domains = await this.organizationDomainRepository.find({
      where: { organizationId },
    });

    return domains;
  }

  async findOne(domain: string) {
    const normalized = domain.toLowerCase().trim();

    const domainRecord = await this.organizationDomainRepository.findOne({
      where: { domain: normalized },
    });

    if (!domainRecord) {
      RpcExceptionHelper.notFound('Domain');
    }

    return domainRecord;
  }

  async update(updateDto: UpdateOrganizationDomainDto) {
    const { id, domain } = updateDto;

    const existing = await this.getDomainByIdOrFail(id);

    if (domain) {
      const normalized = domain.toLowerCase().trim();

      const duplicated = await this.organizationDomainRepository.findOne({
        where: { domain: normalized },
      });

      if (duplicated && duplicated.id !== id) {
        throw RpcExceptionHelper.duplicate('Domain');
      }

      existing.domain = normalized;
    }

    try {
      return await this.organizationDomainRepository.save(existing);
    } catch (error) {
      throw RpcExceptionHelper.handle(error);
    }
  }

  async remove(id: string) {
    const orgDomain = await this.getDomainByIdOrFail(id);

    const domains = await this.organizationDomainRepository.count({
      where: { organizationId: orgDomain.organizationId },
    });

    if (domains === 1) {
      RpcExceptionHelper.badRequestException(
        'Organization must have at least one active domain.',
      );
    }

    try {
      await this.organizationDomainRepository.remove(orgDomain);
      return { message: 'Domain deleted successfully' };
    } catch (error) {
      RpcExceptionHelper.handle(error);
    }
  }

  private async getDomainByIdOrFail(id: string) {
    const domainRecord = await this.organizationDomainRepository.findOne({
      where: { id },
    });

    if (!domainRecord) {
      RpcExceptionHelper.notFound('Domain');
    }

    return domainRecord;
  }

  private async ensureOrganizationExists(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      RpcExceptionHelper.notFound('Organization');
    }

    return organization;
  }
}
