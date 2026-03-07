import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { UserOrganizationModule } from 'src/user_organization/user_organization.module';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  imports: [TypeOrmModule.forFeature([Organization]), UserOrganizationModule],
  exports: [OrganizationService, TypeOrmModule],
})
export class OrganizationModule {}
