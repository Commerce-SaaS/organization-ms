import { OrganizationDomain } from 'src/organization_domains/entities/organization_domain.entity';
import { UserOrganization } from 'src/user_organization/entities/user_organization.entity';
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
}
