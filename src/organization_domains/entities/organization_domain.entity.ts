import { Organization } from "src/organization/entities/organization.entity";
import { Entity, Unique, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity({ name: 'organization_domains' })
@Unique(['domain', 'organizationId'])
export class OrganizationDomain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.domains)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  domain: string; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
