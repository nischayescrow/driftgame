import { Injectable, NotFoundException } from '@nestjs/common';
import { GameOpenLogRepository } from './repositories/game-open.repository';
import { CreateGameOpenLogDto } from './dto/create-game-open.dto';
import { UpdateGameOpenLogDto } from './dto/update-game-open.dto';
import { Types } from 'mongoose';
import { GameOpenLogDocument } from './schemas/game-open.schema';

@Injectable()
export class GameOpenService {
  constructor(private readonly gameOpenLogRepo: GameOpenLogRepository) {}

  async findById(id: string) {
    try {
      const findLog = await this.gameOpenLogRepo.findById(id);

      // console.log('findById', findLog);

      if (!findLog) {
        throw new NotFoundException('Game open log do not found!');
      }

      return {
        data: findLog,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findByUserId(user_id: Types.ObjectId, min?: Date, max?: Date) {
    try {
      const findLog = await this.gameOpenLogRepo.findByUserId(
        user_id,
        min,
        max,
      );

      // console.log('findById', findLog);

      if (!findLog) {
        throw new NotFoundException('Game open log do not found!');
      }

      return {
        data: findLog,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async create(createGameOpenLogDto: CreateGameOpenLogDto) {
    try {
      const Today_Start = new Date(createGameOpenLogDto.lastOpenedAt);
      Today_Start.setUTCHours(0, 0, 0, 0);

      const Today_End = new Date(createGameOpenLogDto.lastOpenedAt);
      Today_End.setUTCHours(23, 59, 59, 999);

      const findConfig = await this.gameOpenLogRepo.findByUserId(
        new Types.ObjectId(createGameOpenLogDto.user_id),
        Today_Start,
        Today_End,
      );

      // console.log('findConfig: ', findConfig);

      if (findConfig && findConfig.length > 0) {
        // update existing log
        const updated = await this.updateById(findConfig[0].id, {
          lastOpenedAt: createGameOpenLogDto.lastOpenedAt,
        });

        console.log('updated: ', updated);
      } else {
        await this.gameOpenLogRepo.create({
          user_id: createGameOpenLogDto.user_id,
          lastOpenedAt: createGameOpenLogDto.lastOpenedAt,
        });
      }

      return {
        message: 'Game log created created successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateById(id: string, updateGameOpenLogDto: UpdateGameOpenLogDto) {
    try {
      const findConfig = await this.findById(id);

      if (!findConfig) {
        throw new NotFoundException('Game open log do not found!');
      }

      await this.gameOpenLogRepo.update(id, updateGameOpenLogDto);

      return {
        status: true,
        message: 'Game open log updated successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteById(id: string) {
    try {
      console.log('UpdateId: ', id);

      await this.gameOpenLogRepo.delete(id);

      return {
        message: 'Game Log deleted successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
