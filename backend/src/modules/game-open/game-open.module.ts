import { Module } from '@nestjs/common';
import { GameOpenService } from './game-open.service';
import { GameOpenController } from './game-open.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GameOpenLog, GameOpenLogSchema } from './schemas/game-open.schema';
import { GameOpenLogRepository } from './repositories/game-open.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameOpenLog.name, schema: GameOpenLogSchema },
    ]),
  ],
  controllers: [GameOpenController],
  providers: [GameOpenService, GameOpenLogRepository],
})
export class GameOpenModule {}
