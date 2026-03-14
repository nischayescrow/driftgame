import { Injectable, NotFoundException } from '@nestjs/common';
import { GameSettingRepository } from './repositories/game-setting.repository';
import { Types } from 'mongoose';
import { CreateGameSettingDto } from './dto/create-game-setting.dto';
import { UpdateGameSettingDto } from './dto/update-game-setting.dto';

@Injectable()
export class GameSettingService {
  constructor(private readonly gameSettingRepo: GameSettingRepository) {}

  async findById(id: string) {
    try {
      const findSetting = await this.gameSettingRepo.findById(id);

      // console.log('findById', findSetting);

      if (!findSetting) {
        throw new NotFoundException('Game Setting do not found!');
      }

      return {
        data: findSetting,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findByUserId(user_id: Types.ObjectId | string) {
    try {
      const findSetting = await this.gameSettingRepo.findByUserId(user_id);

      // console.log('findById', findSetting);

      if (!findSetting) {
        throw new NotFoundException('Game Setting do not found!');
      }

      return {
        data: findSetting,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async create(id: string, createGameSettingDto: CreateGameSettingDto) {
    try {
      await this.gameSettingRepo.create(id, createGameSettingDto);

      return {
        message: 'Game Setting created successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateById(id: string, updateGameSettingDto: UpdateGameSettingDto) {
    try {
      const findSetting = await this.findById(id);

      if (!findSetting) {
        throw new NotFoundException('Game Setting do not found!');
      }

      await this.gameSettingRepo.update(id, updateGameSettingDto);

      return {
        status: true,
        message: 'Game Setting updated successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteById(id: string) {
    try {
      const findSetting = await this.findById(id);

      if (!findSetting) {
        throw new NotFoundException('Game Setting do not found!');
      }

      console.log('UpdateId: ', id);

      await this.gameSettingRepo.delete(id);

      return {
        message: 'Game Setting deleted successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
