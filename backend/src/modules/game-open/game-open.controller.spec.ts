import { Test, TestingModule } from '@nestjs/testing';
import { GameOpenController } from './game-open.controller';
import { GameOpenService } from './game-open.service';

describe('GameOpenController', () => {
  let controller: GameOpenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameOpenController],
      providers: [GameOpenService],
    }).compile();

    controller = module.get<GameOpenController>(GameOpenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
