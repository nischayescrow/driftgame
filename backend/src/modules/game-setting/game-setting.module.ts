import { Module } from '@nestjs/common';
import { GameSettingService } from './game-setting.service';
import { GameSettingController } from './game-setting.controller';

@Module({
  controllers: [GameSettingController],
  providers: [GameSettingService],
})
export class GameSettingModule {}
