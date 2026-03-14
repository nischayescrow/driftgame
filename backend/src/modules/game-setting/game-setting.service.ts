import { Injectable } from '@nestjs/common';
import { CreateGameSettingDto } from './dto/create-game-setting.dto';
import { UpdateGameSettingDto } from './dto/update-game-setting.dto';

@Injectable()
export class GameSettingService {
  create(createGameSettingDto: CreateGameSettingDto) {
    return 'This action adds a new gameSetting';
  }

  findAll() {
    return `This action returns all gameSetting`;
  }

  findOne(id: number) {
    return `This action returns a #${id} gameSetting`;
  }

  update(id: number, updateGameSettingDto: UpdateGameSettingDto) {
    return `This action updates a #${id} gameSetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} gameSetting`;
  }
}
