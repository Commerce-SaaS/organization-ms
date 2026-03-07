import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationDomainsService } from './organization_domains.service';

describe('OrganizationDomainsService', () => {
  let service: OrganizationDomainsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationDomainsService],
    }).compile();

    service = module.get<OrganizationDomainsService>(OrganizationDomainsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
