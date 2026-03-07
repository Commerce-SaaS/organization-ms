import { Module } from '@nestjs/common';
import { OrganizationModule } from './organization/organization.module';
import { OrganizationDomainsModule } from './organization_domains/organization_domains.module';
import { UserOrganizationModule } from './user_organization/user_organization.module';
import { envs } from './config/envs';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from './config/transports/rabbitmq.module';
import { PAYMENTS_EVENTS_CLIENT } from './config/services';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.dbHost,
      port: envs.dbPort ?? 5432,
      username: envs.postgresUser,
      password: envs.postgresPassword,
      database: envs.postgresDb,
      autoLoadEntities: true,
      synchronize: envs.nodeEnv === 'development',
    }),
    RabbitMQModule.register({
      name: PAYMENTS_EVENTS_CLIENT,
      queue: 'events.payments',
      url: envs.rabbitmqUrl,
    }),
    RedisModule,
    OrganizationModule,
    OrganizationDomainsModule,
    UserOrganizationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
