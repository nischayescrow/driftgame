import { Test, TestingModule } from '@nestjs/testing';
import { GameSettingController } from './game-setting.controller';
import { GameSettingService } from './game-setting.service';

describe('GameSettingController', () => {
  let controller: GameSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameSettingController],
      providers: [GameSettingService],
    }).compile();

    controller = module.get<GameSettingController>(GameSettingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
