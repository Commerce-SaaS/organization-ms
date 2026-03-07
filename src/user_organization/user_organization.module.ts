import { Module } from '@nestjs/common';
import { UserOrganizationService } from './user_organization.service';
import { UserOrganizationController } from './user_organization.controller';
import { UserOrganization } from './entities/user_organization.entity';
import { Organization } from 'src/organization/entities/organization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from 'src/config/transports/rabbitmq.module';

@Module({
  controllers: [UserOrganizationController],
  providers: [UserOrganizationService],
  imports: [
    RabbitMQModule,
    TypeOrmModule.forFeature([UserOrganization, Organization]),
  ],
  exports: [UserOrganizationService, TypeOrmModule],
})
export class UserOrganizationModule {}
