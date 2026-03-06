import { Test, TestingModule } from '@nestjs/testing';
import { ClientConfigController } from './client-config.controller';
import { ClientConfigService } from './client-config.service';

describe('ClientConfigController', () => {
  let controller: ClientConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientConfigController],
      providers: [ClientConfigService],
    }).compile();

    controller = module.get<ClientConfigController>(ClientConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
