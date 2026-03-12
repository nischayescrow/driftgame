import { Module } from '@nestjs/common';
import { GameOpenService } from './game-open.service';
import { GameOpenController } from './game-open.controller';

@Module({
  controllers: [GameOpenController],
  providers: [GameOpenService],
})
export class GameOpenModule {}
