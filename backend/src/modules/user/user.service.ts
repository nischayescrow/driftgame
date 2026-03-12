import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserStatus } from './schemas/user.schema';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Server, Socket } from 'socket.io';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { FriendReq, FriendReqStatus } from './schemas/friendReq.schema';
import { UserProj } from './types/user.type';
import { UserRepository } from './repositories/user.repository';
import { FriendReqRepository } from './repositories/friendRequest.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly friendReqRepo: FriendReqRepository,
  ) {}

  private userDataProjection: UserProj = {
    first_name: 1,
    last_name: 1,
    email: 1,
    email_verified: 1,
    picture: 1,
    status: 1,
    friends: 1,
    sentFriendRequests: 1,
    receviedFriendRequests: 1,
    _id: 1,
    createdAt: 1,
    updatedAt: 1,
  };

  async findById(id: string, all: boolean = false, pass: boolean = false) {
    try {
      const findUser = await this.userRepo.findById(
        id,
        all,
        pass
          ? { ...this.userDataProjection, password: 1 }
          : this.userDataProjection,
      );

      console.log('findUser-findById', findUser);

      if (!findUser) {
        return null;
      }

      return findUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findByEmail(
    email: string,
    all: boolean = false,
    pass: boolean = false,
  ) {
    try {
      const findUser = await this.userRepo.findByEmail(
        email,
        all,
        pass
          ? { ...this.userDataProjection, password: 1 }
          : this.userDataProjection,
      );

      console.log('findUser', findUser);

      return findUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async search(
    text: string,
    limit: number = 10,
    page: number = 1,
    all: boolean = false,
    pass: boolean = false,
  ) {
    try {
      const findUsers = await this.userRepo.search(
        text,
        limit,
        page,
        all,
        pass
          ? { ...this.userDataProjection, password: 1 }
          : this.userDataProjection,
      );

      console.log(findUsers);

      return {
        data: findUsers.users,
        total: findUsers.total,
        page,
        limit,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const findUser = await this.findByEmail(createUserDto.email, true);

      if (findUser) {
        throw new BadRequestException('User already registered!');
      }

      if (createUserDto.password) {
        createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
      }

      createUserDto.status = UserStatus.ACTIVE;

      await this.userRepo.create(createUserDto);

      return {
        message: 'User created successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateById(id: string, updateUserDto: UpdateUserDto) {
    try {
      await this.findById(id, true);

      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updated = await this.userRepo.update(id, updateUserDto);

      return {
        message: 'User updated successfully',
        data: {
          _id: updated?.id,
          first_name: updated?.first_name,
          last_name: updated?.last_name,
          email: updated?.email,
          email_verified: updated?.email_verified,
          picture: updated?.picture,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteById(id: string) {
    try {
      console.log('UpdateId: ', id);
      const findUser = await this.findById(id, true);

      if (!findUser) {
        throw new NotFoundException('User do not found!');
      }

      await this.updateById(findUser.id, { status: UserStatus.DELETED });

      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  //User: Friend CRUD
  async addFriend(id: string, friendId: string) {
    try {
      const findUser = await this.findById(id);
      const findFriend = await this.findById(friendId);

      if (!findUser || !findFriend) {
        throw new NotFoundException('User do not found!');
      }

      await this.userRepo.addValInSetField(id, 'friends', friendId);

      return {
        message: 'Friends added successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async removeFriend(id: string, friendId: string) {
    try {
      const findUser = await this.findById(id);
      const findFriend = await this.findById(friendId);

      if (!findUser || !findFriend) {
        throw new NotFoundException('User do not found!');
      }

      await this.userRepo.removeValInSetField(id, 'friends', friendId);

      return {
        message: 'Friends removed successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  //User: sentFriendRequests
  async addSentFriendReq(id: string, requestId: string) {
    try {
      const findUser = await this.findById(id);
      const findReq = await this.friendReqRepo.findById(requestId);

      if (!findUser) {
        throw new NotFoundException('User do not found!');
      }

      if (!findReq) {
        throw new NotFoundException('Request do not found!');
      }

      await this.userRepo.addValInSetField(id, 'sentFriendRequests', requestId);

      return {
        message: 'sentFriendRequests added successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async removeSentFriendReq(id: string, requestId: string) {
    try {
      const findUser = await this.findById(id);
      const findReq = await this.friendReqRepo.findById(requestId);

      if (!findUser) {
        throw new NotFoundException('User do not found!');
      }

      if (!findReq) {
        throw new NotFoundException('Request do not found!');
      }

      await this.userRepo.removeValInSetField(
        id,
        'sentFriendRequests',
        requestId,
      );

      return {
        message: 'sentFriendRequests removed successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  //User: receivedFriendRequests
  async addReceviedFriendReq(id: string, requestId: string) {
    try {
      const findUser = await this.findById(id);
      const findReq = await this.friendReqRepo.findById(requestId);

      if (!findUser) {
        throw new NotFoundException('User do not found!');
      }

      if (!findReq) {
        throw new NotFoundException('Request do not found!');
      }

      await this.userRepo.addValInSetField(
        id,
        'receviedFriendRequests',
        requestId,
      );

      return {
        message: 'receviedFriendRequests added successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async removeReceviedFriendReq(id: string, requestId: string) {
    try {
      const findUser = await this.findById(id);
      const findReq = await this.friendReqRepo.findById(requestId);

      if (!findUser) {
        throw new NotFoundException('User do not found!');
      }

      if (!findReq) {
        throw new NotFoundException('Request do not found!');
      }

      await this.userRepo.removeValInSetField(
        id,
        'receviedFriendRequests',
        requestId,
      );

      return {
        message: 'receviedFriendRequests removed successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
