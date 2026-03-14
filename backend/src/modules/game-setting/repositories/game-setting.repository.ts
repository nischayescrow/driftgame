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
export class GameSettingRepository {
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
  ): Promise<GameSettingDocument[] | null> {
    // console.log(findQuery);

    const findLogs = await this.gameSettingModel.find({ user_id });

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
