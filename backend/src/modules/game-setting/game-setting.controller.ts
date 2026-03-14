import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { GameSettingService } from './game-setting.service';
import { UpdateGameSettingDto } from './dto/update-game-setting.dto';
import { CreateGameSettingDto } from './dto/create-game-setting.dto';
import { Types } from 'mongoose';
import type { Request } from 'express';

@Controller('game-setting')
export class GameSettingController {
  constructor(private readonly gameSettingService: GameSettingService) {}

  @Get('find/:id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id') id: string) {
    return this.gameSettingService.findById(id.trim());
  }

  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  findByUserId(@Param('id') id: string) {
    return this.gameSettingService.findByUserId(new Types.ObjectId(id.trim()));
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createGameSettingDto: CreateGameSettingDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    return this.gameSettingService.create(req.user.id, createGameSettingDto);
  }

  @Patch('update/:id')
  @HttpCode(HttpStatus.OK)
  updateById(
    @Param('id') id: string,
    @Body() updateGameSettingDto: UpdateGameSettingDto,
  ) {
    return this.gameSettingService.updateById(id.trim(), updateGameSettingDto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  deleteById(@Param('id') id: string) {
    return this.gameSettingService.deleteById(id.trim());
  }
}
