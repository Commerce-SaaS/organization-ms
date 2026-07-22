import { OrganizationDomain } from 'src/organization_domains/entities/organization_domain.entity';
import { UserOrganization } from 'src/user_organization/entities/user_organization.entity';
import { OpeningHoursDto } from '../dto/opening-hours.dto';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['ownerId', 'name'], { unique: true })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address?: string;

  @OneToMany(() => OrganizationDomain, (d) => d.organization)
  domains: OrganizationDomain[];

  @Column()
  ownerId: string;

  @OneToMany(() => UserOrganization, (userOrg) => userOrg.organization)
  userOrganizations: UserOrganization[];

  @Column({ nullable: true, type: 'varchar' })
  stripeAccountId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column()
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone?: string;

  // Scheduled-order settings — see PROD MIGRATION NOTE below.
  @Column({ type: 'int', default: 15 })
  orderSchedulingIntervalMinutes: number; // one of 5 | 10 | 15 | 30, enforced in the DTO

  @Column({ type: 'int', default: 20 })
  maxDishesPerSlot: number;

  // null = open at all times (no restriction applied when generating slots)
  @Column({ type: 'jsonb', nullable: true })
  openingHours?: OpeningHoursDto | null;

  // IANA timezone name (e.g. "Europe/Madrid"). openingHours "HH:mm" values and
  // scheduled-order slots are interpreted in this zone, not the server's.
  @Column({ type: 'varchar', default: 'UTC' })
  timezone: string;
}

// PROD MIGRATION NOTE (TypeORM synchronize handles dev automatically; do NOT
// run synchronize in production):
//   ALTER TABLE organization ADD COLUMN "orderSchedulingIntervalMinutes" int NOT NULL DEFAULT 15;
//   ALTER TABLE organization ADD COLUMN "maxDishesPerSlot" int NOT NULL DEFAULT 20;
//   ALTER TABLE organization ADD COLUMN "openingHours" jsonb;
//   ALTER TABLE organization ADD COLUMN "timezone" varchar NOT NULL DEFAULT 'UTC';
