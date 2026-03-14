import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import {
  GameSetting,
  GameSettingDocument,
} from '../schemas/game-setting.schema';
import { CreateGameSettingDto } from '../dto/create-game-setting.dto';
import { UpdateGameSettingDto } from '../dto/update-game-setting.dto';

@Injectable()
export class GameOpenLogRepository {
  constructor(
    @InjectModel(GameSetting.name)
    private gameSettingModel: Model<GameSettingDocument>,
  ) {}

  async create(data: CreateGameSettingDto): Promise<GameSettingDocument> {
    const config = new this.gameSettingModel(data);
    return await config.save();
  }

  async findByUserId(
    user_id: Types.ObjectId,
    min?: Date,
    max?: Date,
  ): Promise<GameSettingDocument[] | null> {
    const findQuery: {
      user_id: Types.ObjectId;
      lastOpenedAt?: {
        $gte?: Date;
        $lte?: Date;
      };
    } = { user_id };

    if (min && max) {
      findQuery.lastOpenedAt = {
        $gte: min,
        $lte: max,
      };
    } else if (min) {
      findQuery.lastOpenedAt = {
        $gte: max,
      };
    } else if (max) {
      findQuery.lastOpenedAt = {
        $lte: max,
      };
    }

    // console.log(findQuery);

    const findLogs = await this.gameSettingModel.find(findQuery);

    return findLogs;
  }

  async findById(id: string): Promise<GameSettingDocument | null> {
    const isObjectId = isObjectIdOrHexString(id);

    if (!isObjectId) {
      throw new BadRequestException('Invalid user id!');
    }

    // console.log('findById: ', id);

    return await this.gameSettingModel.findOne({
      _id: id,
    });
  }

  async findAll(): Promise<GameSettingDocument[]> {
    return await this.gameSettingModel.find({});
  }

  async update(
    id: string,
    data: UpdateGameSettingDto,
  ): Promise<GameSettingDocument | null> {
    return await this.gameSettingModel.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  async delete(id: string): Promise<GameSettingDocument | null> {
    return await this.gameSettingModel.findByIdAndDelete(id);
  }
}
