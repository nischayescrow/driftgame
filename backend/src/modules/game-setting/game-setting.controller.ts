import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GameSettingService } from './game-setting.service';
import { CreateGameSettingDto } from './dto/create-game-setting.dto';
import { UpdateGameSettingDto } from './dto/update-game-setting.dto';

@Controller('game-setting')
export class GameSettingController {
  constructor(private readonly gameSettingService: GameSettingService) {}

  @Post()
  create(@Body() createGameSettingDto: CreateGameSettingDto) {
    return this.gameSettingService.create(createGameSettingDto);
  }

  @Get()
  findAll() {
    return this.gameSettingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gameSettingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGameSettingDto: UpdateGameSettingDto) {
    return this.gameSettingService.update(+id, updateGameSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gameSettingService.remove(+id);
  }
}
