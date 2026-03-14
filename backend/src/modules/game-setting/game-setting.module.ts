import { Module } from '@nestjs/common';
import { GameSettingService } from './game-setting.service';
import { GameSettingController } from './game-setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GameSetting, GameSettingSchema } from './schemas/game-setting.schema';
import { GameSettingRepository } from './repositories/game-setting.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameSetting.name, schema: GameSettingSchema },
    ]),
    UserModule,
  ],
  controllers: [GameSettingController],
  providers: [GameSettingService, GameSettingRepository],
})
export class GameSettingModule {}
