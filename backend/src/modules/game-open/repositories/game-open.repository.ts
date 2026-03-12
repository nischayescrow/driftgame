import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { GameOpenLog, GameOpenLogDocument } from '../schemas/game-open.schema';
import { CreateGameOpenLogDto } from '../dto/create-game-open.dto';
import { UpdateGameOpenLogDto } from '../dto/update-game-open.dto';

@Injectable()
export class GameOpenLogRepository {
  constructor(
    @InjectModel(GameOpenLog.name)
    private gameOpenLogModel: Model<GameOpenLogDocument>,
  ) {}

  async create(data: CreateGameOpenLogDto): Promise<GameOpenLogDocument> {
    const config = new this.gameOpenLogModel(data);
    return await config.save();
  }

  async findByUserId(
    user_id: Types.ObjectId,
    min?: Date,
    max?: Date,
  ): Promise<GameOpenLogDocument[] | null> {
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

    const findLogs = await this.gameOpenLogModel.find(findQuery);

    return findLogs;
  }

  async findById(id: string): Promise<GameOpenLogDocument | null> {
    const isObjectId = isObjectIdOrHexString(id);

    if (!isObjectId) {
      throw new BadRequestException('Invalid user id!');
    }

    // console.log('findById: ', id);

    return await this.gameOpenLogModel.findOne({
      _id: id,
    });
  }

  async findAll(): Promise<GameOpenLogDocument[]> {
    return await this.gameOpenLogModel.find({});
  }

  async update(
    id: string,
    data: UpdateGameOpenLogDto,
  ): Promise<GameOpenLogDocument | null> {
    return await this.gameOpenLogModel.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  async delete(id: string): Promise<GameOpenLogDocument | null> {
    return await this.gameOpenLogModel.findByIdAndDelete(id);
  }
}
