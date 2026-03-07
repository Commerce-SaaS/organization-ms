import { Module } from '@nestjs/common';
import { OrganizationDomainsService } from './organization_domains.service';
import { OrganizationDomainsController } from './organization_domains.controller';
import { RabbitMQModule } from 'src/config/transports/rabbitmq.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationDomain } from './entities/organization_domain.entity';
import { Organization } from 'src/organization/entities/organization.entity';

@Module({
  controllers: [OrganizationDomainsController],
  providers: [OrganizationDomainsService],
  imports: [
    RabbitMQModule,
    TypeOrmModule.forFeature([OrganizationDomain, Organization]),
  ],
  exports: [OrganizationDomainsService, TypeOrmModule],
})
export class OrganizationDomainsModule {}
