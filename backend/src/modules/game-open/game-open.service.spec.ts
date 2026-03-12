import { Test, TestingModule } from '@nestjs/testing';
import { GameOpenService } from './game-open.service';

describe('GameOpenService', () => {
  let service: GameOpenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameOpenService],
    }).compile();

    service = module.get<GameOpenService>(GameOpenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
