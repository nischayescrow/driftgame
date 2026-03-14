import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model } from 'mongoose';
import { FriendReq, FriendReqDocument } from '../schemas/friendReq.schema';

@Injectable()
export class FriendReqRepository {
  constructor(
    @InjectModel(FriendReq.name)
    private friendReqModel: Model<FriendReqDocument>,
  ) {}

  async create(data: Partial<FriendReqDocument>): Promise<FriendReqDocument> {
    const friendReq = new this.friendReqModel(data);
    return await friendReq.save();
  }

  async findById(id: string): Promise<FriendReqDocument | null> {
    const isObjectId = isObjectIdOrHexString(id);

    if (!isObjectId) {
      throw new BadRequestException('Invalid user id!');
    }

    return await this.friendReqModel.findById(id);
  }

  async findAll(): Promise<FriendReqDocument[]> {
    return await this.friendReqModel.find();
  }

  async update(
    id: string,
    data: Partial<FriendReqDocument>,
  ): Promise<FriendReqDocument | null> {
    return await this.friendReqModel.findByIdAndUpdate(id, data);
  }

  async delete(id: string): Promise<FriendReqDocument | null> {
    return await this.friendReqModel.findByIdAndDelete(id);
  }
}
