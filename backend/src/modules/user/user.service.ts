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
import {
  findByIdResType,
  FrinedLiveStatusType,
  UserOnlineStatus,
  UserProj,
} from './types/user.type';
import { UserRepository } from './repositories/user.repository';
import { FriendReqRepository } from './repositories/friendRequest.repository';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';
import { SessionHash } from '../auth/types/auth.type';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly friendReqRepo: FriendReqRepository,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async findById(
    id: string,
    all: boolean = false,
    pass: boolean = false,
    friends: boolean = false,
    sentReq: boolean = false,
    receiveReq: boolean = false,
  ) {
    try {
      const findUser = await this.userRepo.findById(id, all);

      console.log('findUser-findById', findUser);

      if (!findUser) {
        return null;
      }

      let data: findByIdResType = {
        id: findUser.id,
        first_name: findUser.first_name,
        last_name: findUser.last_name,
        email: findUser.email,
        email_verified: findUser.email_verified,
        picture: findUser.picture,
        status: findUser.status,
        createdAt: findUser.createdAt,
      };

      if (pass) data.password = findUser.password;

      if (friends) {
        const findFriends = await this.userRepo.getFriends(id, all);

        console.log('findById-findFriends: ', findFriends);

        if (
          findFriends &&
          findFriends.friends &&
          findFriends.friends.length > 0
        ) {
          const friends: findByIdResType[] = findFriends.friends.map((frn) => {
            return {
              id: frn.id,
              first_name: frn.first_name,
              last_name: frn.last_name,
              email: frn.email,
              email_verified: frn.email_verified,
              picture: frn.picture,
              status: frn.status,
            };
          });

          data.friends = friends;
        } else {
          data.friends = [];
        }
      }

      if (sentReq) {
        if (
          findUser &&
          findUser.sentFriendRequests &&
          findUser.sentFriendRequests.length > 1
        ) {
          data.sentFriendRequests = [];
          for (let frnReq in findUser.sentFriendRequests) {
            const findReq = await this.friendReqRepo.findById(frnReq);
            if (!findReq) continue;

            const sender = await this.userRepo.findById(
              String(findReq.sender_id),
            );

            const receiver = await this.userRepo.findById(
              String(findReq.receiver_id),
            );

            if (!sender || !receiver) {
              continue;
            }

            data.sentFriendRequests.push({
              id: findReq.id,
              sender: {
                id: sender.id,
                first_name: sender.first_name,
                last_name: sender.last_name,
                email: sender.email,
                email_verified: sender.email_verified,
                picture: sender.picture,
              },
              receiver: {
                id: receiver.id,
                first_name: receiver.first_name,
                last_name: receiver.last_name,
                email: receiver.email,
                email_verified: receiver.email_verified,
                picture: receiver.picture,
              },
              status: findReq.status,
              createdAt: findReq.createdAt,
              updatedAt: findReq.updatedAt,
            });
          }
        } else {
          data.sentFriendRequests = [];
        }
      }

      if (receiveReq) {
        if (
          findUser &&
          findUser.receviedFriendRequests &&
          findUser.receviedFriendRequests.length > 1
        ) {
          data.receviedFriendRequests = [];
          for (let frnReq in findUser.receviedFriendRequests) {
            const findReq = await this.friendReqRepo.findById(frnReq);
            if (!findReq) continue;

            const sender = await this.userRepo.findById(
              String(findReq.sender_id),
            );

            const receiver = await this.userRepo.findById(
              String(findReq.receiver_id),
            );

            if (!sender || !receiver) {
              continue;
            }
            data.receviedFriendRequests.push({
              id: findReq.id,
              sender: {
                id: sender.id,
                first_name: sender.first_name,
                last_name: sender.last_name,
                email: sender.email,
                email_verified: sender.email_verified,
                picture: sender.picture,
              },
              receiver: {
                id: receiver.id,
                first_name: receiver.first_name,
                last_name: receiver.last_name,
                email: receiver.email,
                email_verified: receiver.email_verified,
                picture: receiver.picture,
              },
              status: findReq.status,
              createdAt: findReq.createdAt,
              updatedAt: findReq.updatedAt,
            });
          }
        } else {
          data.receviedFriendRequests = [];
        }
      }

      return { data };
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
      const findUser = await this.userRepo.findByEmail(email, all);

      if (!findUser) {
        return null;
      }

      console.log('findUser', findUser);

      let data: findByIdResType = {
        id: findUser.id,
        first_name: findUser.first_name,
        last_name: findUser.last_name,
        email: findUser.email,
        email_verified: findUser.email_verified,
        picture: findUser.picture,
        status: findUser.status,
        createdAt: findUser.createdAt,
      };

      if (pass) data.password = findUser.password;

      return { data };
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
      const findUsers = await this.userRepo.search(text, limit, page, all);

      console.log(findUsers);

      const data = findUsers.users.map((usr) => {
        return {
          id: usr.id,
          first_name: usr.first_name,
          last_name: usr.last_name,
          email: usr.email,
          email_verified: usr.email_verified,
          picture: usr.picture,
          status: usr.status,
        };
      });

      return {
        data,
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

      if (!updated) {
        throw new InternalServerErrorException(
          'Error occured while updating user!',
        );
      }

      return {
        message: 'User updated successfully',
        data: {
          id: updated.id,
          first_name: updated.first_name,
          last_name: updated.last_name,
          email: updated.email,
          email_verified: updated.email_verified,
          picture: updated.picture,
          status: updated.status,
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

      await this.updateById(findUser.data.id, { status: UserStatus.DELETED });

      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // User online status
  async getUserOnlineStatus(id: string): Promise<UserOnlineStatus | null> {
    try {
      const findUser = await this.userRepo.findById(id, false);

      console.log('findUser-findById', findUser);

      if (!findUser) {
        return null;
      }

      const userSession = (await this.redis.hgetall(
        `sessions:${id}`,
      )) as unknown as SessionHash;

      if (!userSession || !userSession.session_id) {
        return UserOnlineStatus.OFFLINE;
      }

      const userSocket = await this.redis.get(
        `sockets:${userSession.socket_id}`,
      );

      if (!userSocket) {
        return UserOnlineStatus.OFFLINE;
      }

      const userOnlineStatus = await this.redis.get(`online:${id}`);

      if (!userOnlineStatus) {
        return UserOnlineStatus.OFFLINE;
      }

      return UserOnlineStatus.ONLINE;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  //Friend CRUD
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

  //Friend: sentFriendRequests
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

  //Friend: receivedFriendRequests
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

  //Friend: getFriendsOnlineStatus
  async getFriendsOnlineStatus(id: string) {
    try {
      const findFriends = await this.userRepo.getFriends(id);

      console.log('getFriendsOnlineStatus-findFriends', findFriends);

      if (!findFriends) {
        throw new NotFoundException('User do not found!');
      }

      if (findFriends && findFriends.friends.length <= 0) {
        return {
          message: 'User do hane any friends!',
        };
      }

      const friendsStatus: FrinedLiveStatusType[] = [];

      for (let frn of findFriends.friends) {
        const frnStatus = await this.getUserOnlineStatus(frn.id);

        console.log('frnStatus: ', frnStatus);

        if (frnStatus !== null) {
          friendsStatus.push({
            friend_id: frn.id,
            liveStatus: frnStatus,
          });
        }
      }

      return {
        data: friendsStatus,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
