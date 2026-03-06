import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FriendReqRepository } from './repositories/friendRequest.repository';
import { FriendReqStatus } from './schemas/friendReq.schema';
import { Types } from 'mongoose';

@Injectable()
export class FriendReqService {
  constructor(private readonly friendReqRepo: FriendReqRepository) {}

  //Friend request CRUD
  async createFriendRequest(
    sender_id: string,
    receiver_id: string,
    status: FriendReqStatus = FriendReqStatus.NOTSEND,
  ) {
    try {
      const sender = await this.findById(sender_id);
      const receiver = await this.findById(receiver_id);

      if (!sender || !receiver) {
        throw new NotFoundException('User do not found!');
      }

      return await this.friendReqRepo.create({
        sender_id: new Types.ObjectId(sender_id),
        receiver_id: new Types.ObjectId(receiver_id),
        status: status,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const findReq = await this.friendReqRepo.findById(id);

      if (!findReq) {
        throw new BadRequestException('Request do not found!');
      }

      return findReq;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateFriendReqStatus(id: string, status: FriendReqStatus) {
    try {
      const findReq = await this.friendReqRepo.findById(id);

      if (!findReq) {
        throw new NotFoundException('Request do not found!');
      }

      await this.friendReqRepo.update(id, { status });

      return {
        message: 'Friend request updated successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteById(id: string) {
    try {
      console.log('UpdateId: ', id);
      const findReq = await this.findById(id);

      await this.friendReqRepo.delete(findReq.id);

      return {
        message: 'Friend deleted successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
