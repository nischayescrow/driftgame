import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { User, UserDocument, UserStatus } from '../schemas/user.schema';
import { UserProj } from '../types/user.type';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(data: Partial<UserDocument>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return await user.save();
  }

  async findByEmail(
    email: string,
    all: boolean,
    userProj: UserProj,
  ): Promise<UserDocument | null> {
    const findQuery = all
      ? {
          $and: [{ email }],
        }
      : {
          $and: [{ email }, { status: UserStatus.ACTIVE }],
        };

    return await this.userModel.findOne(findQuery, userProj);
  }

  async findById(
    id: string,
    all: boolean,
    userProj: UserProj,
  ): Promise<UserDocument | null> {
    const isObjectId = isObjectIdOrHexString(id);

    if (!isObjectId) {
      throw new BadRequestException('Invalid user id!');
    }

    console.log('findById: ', id);

    const findQuery = all
      ? {
          _id: id,
        }
      : {
          _id: id,
          status: UserStatus.ACTIVE,
        };

    return await this.userModel.findOne(findQuery, userProj);
  }

  async search(
    text: string,
    limit: number = 10,
    page: number = 1,
    all: boolean = false,
    userProj: UserProj,
  ): Promise<{ users: UserDocument[]; total: number }> {
    const findQuery = all
      ? {
          $or: [
            { first_name: { $regex: text, $options: 'i' } },
            { last_name: { $regex: text, $options: 'i' } },
            { email: { $regex: text, $options: 'i' } },
          ],
        }
      : {
          $and: [
            {
              $or: [
                { first_name: { $regex: text, $options: 'i' } },
                { last_name: { $regex: text, $options: 'i' } },
                { email: { $regex: text, $options: 'i' } },
              ],
            },
            { status: UserStatus.ACTIVE },
          ],
        };

    const skip = (page - 1) * limit;
    const totalUsers = await this.userModel.countDocuments(findQuery);

    return {
      users: await this.userModel
        .find(findQuery, userProj)
        .limit(limit)
        .skip(skip),
      total: totalUsers,
    };
  }

  async findAll(): Promise<UserDocument[]> {
    return await this.userModel.find();
  }

  async update(
    id: string,
    data: Partial<UserDocument>,
  ): Promise<UserDocument | null> {
    return await this.userModel.findByIdAndUpdate(id, data);
  }

  async addValInSetField(
    id: string,
    fieldName: string,
    value: string,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        $addToSet: {
          [fieldName]: new Types.ObjectId(value),
        },
      },
      { upsert: false },
    );
  }

  async removeValInSetField(
    id: string,
    fieldName: string,
    value: string,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        $pull: {
          [fieldName]: new Types.ObjectId(value),
        },
      },
      { upsert: false },
    );
  }

  async delete(id: string): Promise<UserDocument | null> {
    return await this.userModel.findByIdAndDelete(id);
  }
}
