import { Organization } from 'src/organization/entities/organization.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationRole } from '../enums/organization-roles.enum';

@Entity()
@Index(['userId', 'organization'], { unique: true })
export class UserOrganization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(
    () => Organization,
    (organization) => organization.userOrganizations,
  )
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: OrganizationRole,
  })
  role: OrganizationRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
