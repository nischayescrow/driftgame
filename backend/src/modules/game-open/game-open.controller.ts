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
  Query,
} from '@nestjs/common';
import { GameOpenService } from './game-open.service';
import { UpdateGameOpenLogDto } from './dto/update-game-open.dto';
import { CreateGameOpenLogDto } from './dto/create-game-open.dto';
import { Types } from 'mongoose';

@Controller('game-open')
export class GameOpenController {
  constructor(private readonly gameOpenService: GameOpenService) {}

  @Get('find/:id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id') id: string) {
    return this.gameOpenService.findById(id.trim());
  }

  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  findByUserId(@Param('id') id: string) {
    return this.gameOpenService.findByUserId(new Types.ObjectId(id.trim()));
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createGameOpenLogDto: CreateGameOpenLogDto) {
    return this.gameOpenService.create(createGameOpenLogDto);
  }

  @Patch('update/:id')
  @HttpCode(HttpStatus.OK)
  updateById(
    @Param('id') id: string,
    @Body() updateGameOpenLogDto: UpdateGameOpenLogDto,
  ) {
    return this.gameOpenService.updateById(id.trim(), updateGameOpenLogDto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  deleteById(@Param('id') id: string) {
    return this.gameOpenService.deleteById(id.trim());
  }
}
