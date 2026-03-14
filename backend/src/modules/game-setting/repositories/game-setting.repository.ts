import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import {
  Controls,
  GameSetting,
  GameSettingDocument,
} from '../schemas/game-setting.schema';
import { CreateGameSettingDto } from '../dto/create-game-setting.dto';
import {
  UpdateControlSettingDto,
  UpdateGameSettingDto,
} from '../dto/update-game-setting.dto';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class GameSettingRepository {
  constructor(
    @InjectModel(GameSetting.name)
    private gameSettingModel: Model<GameSettingDocument>,
    private readonly userService: UserService,
  ) {}

  async create(
    id: string,
    data: CreateGameSettingDto,
  ): Promise<GameSettingDocument> {
    const finalData = { ...data, user_id: id };
    const config = new this.gameSettingModel(finalData);
    return await config.save();
  }

  async findByUserId(
    user_id: Types.ObjectId | string,
  ): Promise<GameSettingDocument | null> {
    const isObjectId = isObjectIdOrHexString(user_id);

    if (!isObjectId) {
      throw new BadRequestException('Invalid user user_id!');
    }

    const findUser = await this.userService.findById(String(user_id));

    if (!findUser) {
      return null;
    }

    const findSetting = await this.gameSettingModel.findOne({
      user_id: findUser.data.id,
    });

    return findSetting;
  }

  async findById(id: string): Promise<GameSettingDocument | null> {
    const isObjectId = isObjectIdOrHexString(id);

    if (!isObjectId) {
      throw new BadRequestException('Invalid user id!');
    }

    const findSetting = await this.gameSettingModel.findOne({
      _id: id,
    });

    return findSetting;
  }

  async findAll(): Promise<GameSettingDocument[]> {
    return await this.gameSettingModel.find({});
  }

  async update(
    id: string,
    data: UpdateGameSettingDto,
  ): Promise<GameSettingDocument | null> {
    const findSetting = await this.findByUserId(id);

    if (!findSetting) {
      return null;
    }

    // if (data.gameplay) {
    //   findSetting.gameplay = { ...findSetting.gameplay, ...data.gameplay };
    // }

    // if (data.controls) {
    //   if (data.controls.drift_tunning) {
    //     findSetting.controls.drift_tunning = {
    //       ...findSetting.controls.drift_tunning,
    //       ...data.controls.drift_tunning,
    //     };

    //     delete data.controls.drift_tunning;
    //   }

    //   findSetting.controls = {
    //     ...findSetting.controls,
    //     ...(data.controls as Omit<Controls, 'drift_tunning'>),
    //   };
    // }

    // if (data.graphics) {
    //   findSetting.graphics = { ...findSetting.graphics, ...data.graphics };
    // }

    // if (data.sound) {
    //   findSetting.sound = { ...findSetting.sound, ...data.sound };
    // }

    const updatedGameSettings = await this.gameSettingModel.findByIdAndUpdate(
      id,
      data,
      { returnDocument: 'after' },
    );

    console.log('updatedGameSettings: ', updatedGameSettings);

    return updatedGameSettings;
  }

  async delete(id: string): Promise<GameSettingDocument | null> {
    return await this.gameSettingModel.findByIdAndDelete(id);
  }
}
