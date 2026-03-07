import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationDomainsController } from './organization_domains.controller';
import { OrganizationDomainsService } from './organization_domains.service';

describe('OrganizationDomainsController', () => {
  let controller: OrganizationDomainsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationDomainsController],
      providers: [OrganizationDomainsService],
    }).compile();

    controller = module.get<OrganizationDomainsController>(OrganizationDomainsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
