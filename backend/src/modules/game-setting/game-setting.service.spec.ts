import { Test, TestingModule } from '@nestjs/testing';
import { GameSettingService } from './game-setting.service';

describe('GameSettingService', () => {
  let service: GameSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameSettingService],
    }).compile();

    service = module.get<GameSettingService>(GameSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
