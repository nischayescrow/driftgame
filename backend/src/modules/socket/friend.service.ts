import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Server, Socket } from 'socket.io';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';
import { Model, Types } from 'mongoose';
import { FriendReq, FriendReqStatus } from '../user/schemas/friendReq.schema';
import { User } from '../user/schemas/user.schema';
import { UserService } from '../user/user.service';
import { FriendReqService } from '../user/friendReq.service';

@Injectable()
export class FriendService {
  constructor(
    @Inject(REDIS_CLIENT) private redis: Redis,
    @Inject(UserService) private userService: UserService,
    @Inject(FriendReqService) private friendReqService: FriendReqService,
  ) {}

  // Friends
  async sentFriendReq(
    client: Socket,
    server: Server,
    payload: { sender_id: string; receiver_id: string },
  ) {
    try {
      console.log('sentFriendReq:Payload: ', payload);

      // Check if they are already friends
      const sender = await this.userService.findById(
        payload.sender_id,
        false,
        false,
        true,
        true,
      );

      if (!sender) {
        client.emit('message', { status: 400, message: 'Invalid Sender id!' });
        return;
      }

      const receiver = await this.userService.findById(
        payload.receiver_id,
        false,
        false,
        true,
        true,
      );

      if (!receiver) {
        client.emit('message', {
          status: 400,
          message: 'Invalid Receiver id!',
        });
        return;
      }

      let isAlreadyFriend: boolean = false;

      if (receiver.data.friends && receiver.data.friends.length > 1) {
        for (let frn of receiver.data.friends) {
          if (frn.id === sender.data.id) {
            isAlreadyFriend = true;
            break;
          }
        }
      }

      if (isAlreadyFriend) {
        client.emit('message', {
          status: 400,
          message: `User already in friends list`,
        });
        return;
      }

      // if there is already pending request
      if (
        sender.data.sentFriendRequests &&
        sender.data.sentFriendRequests.length > 0
      ) {
        const exist = await Promise.all(
          sender.data.sentFriendRequests.map(async (r) => {
            if (
              r &&
              String(r) === receiver.data.id &&
              r.status === FriendReqStatus.PENDING
            ) {
              return r;
            }
          }),
        );

        if (exist && exist.length > 0) {
          client.emit('message', {
            status: 200,
            message: `Friend request still pending from user`,
          });
          return;
        }
      }

      //Send friend request
      const sockets = await server.fetchSockets();

      const findReceiverSocket = await this.redis.hget(
        `sessions:${payload.receiver_id}`,
        'socket_id',
      );

      console.log('findReceiverSocket: ', findReceiverSocket);

      const liveUser = sockets.filter((sck) => sck.id === findReceiverSocket);

      console.log('liveUser: ', liveUser ? true : false);

      const friendRequest = await this.friendReqService.createFriendRequest(
        payload.sender_id,
        payload.receiver_id,
      );

      console.log('friendRequest: ', friendRequest);

      if (liveUser && liveUser.length > 0) {
        const findUser = await this.userService.findById(client.data.user);

        if (!findUser) {
          client.disconnect();
          throw new UnauthorizedException('User do not found!');
        }

        server.to(String(findReceiverSocket)).emit('friend:request:received', {
          requestId: friendRequest.id,
          message: `Friend request received from "${findUser.data.first_name + ' ' + findUser.data.last_name}"`,
        });

        await this.friendReqService.updateFriendReqStatus(
          String(friendRequest.id),
          FriendReqStatus.SENT,
        );

        console.log('friendRequest: ', friendRequest);

        client.emit('message', {
          status: 200,
          message: `Friend request sent successfully`,
        });
      } else {
        // Receiver is not live
        await this.friendReqService.updateFriendReqStatus(
          String(friendRequest.id),
          FriendReqStatus.PENDING,
        );

        client.emit('message', {
          status: 200,
          message: `User is not online, Task Added into queue`,
        });
      }

      // sentFriendRequests add into sender;
      await this.userService.addSentFriendReq(
        String(friendRequest.sender_id),
        friendRequest.id,
      );

      // receviedFriendRequests add into sender;
      await this.userService.addReceviedFriendReq(
        String(friendRequest.receiver_id),
        friendRequest.id,
      );

      // console.log('result: ', result);
    } catch (error) {
      console.log(error);
    }
  }

  async friendReqAccepted(
    client: Socket,
    server: Server,
    payload: { requestId: string },
  ) {
    try {
      const sockets = await server.fetchSockets();

      const findReqest = await this.friendReqService.findById(
        payload.requestId,
      );

      if (!findReqest) {
        client.emit('message', {
          status: 400,
          server: `Friend Request do not found!`,
        });
        return;
      }

      const findSenderSocket = await this.redis.hget(
        `sessions:${findReqest.sender_id}`,
        'socket_id',
      );

      // console.log('findSenderSocket: ', findSenderSocket);

      const liveUser = sockets.filter((sck) => sck.id === findSenderSocket);

      const findUser = await this.userService.findById(client.data.user);

      if (!findUser) {
        client.disconnect();
        throw new UnauthorizedException('User do not found!');
      }

      if (liveUser && liveUser.length > 0) {
        server.to(String(findSenderSocket)).emit('message', {
          status: 200,
          message: `Friend request accepted by "${findUser.data.first_name + ' ' + findUser.data.last_name}"`,
        });
      } else {
        // sender is not live
        client.emit('message', {
          status: 200,
          message: `${findUser.data.first_name + ' ' + findUser.data.last_name} is now your friend!`,
        });
      }

      this.friendReqService.updateFriendReqStatus(
        String(payload.requestId),
        FriendReqStatus.ACCEPTED,
      );

      // add friend id into sender account;
      await this.userService.addFriend(
        String(findReqest.sender_id),
        String(findReqest.receiver_id),
      );

      // add friend id into receiver account;
      await this.userService.addFriend(
        String(findReqest.receiver_id),
        String(findReqest.sender_id),
      );

      // sentFriendRequests remove into sender;
      await this.userService.removeSentFriendReq(
        String(findReqest.sender_id),
        payload.requestId,
      );

      // receviedFriendRequests remove into receiver;
      await this.userService.removeReceviedFriendReq(
        String(findReqest.receiver_id),
        payload.requestId,
      );

      // console.log('result: ', result);
    } catch (error) {
      console.log(error);
    }
  }

  async friendReqRejected(
    client: Socket,
    server: Server,
    payload: { requestId: string },
  ) {
    try {
      const sockets = await server.fetchSockets();

      const findReqest = await this.friendReqService.findById(
        payload.requestId,
      );

      if (!findReqest) {
        client.emit('message', {
          status: 400,
          message: `Friend Request do not found!`,
        });
        return;
      }

      const findSenderSocket = await this.redis.hget(
        `sessions:${findReqest.sender_id}`,
        'socket_id',
      );

      console.log('findSenderSocket: ', findSenderSocket);

      const liveUser = sockets.filter((sck) => sck.id === findSenderSocket);

      const findUser = await this.userService.findById(client.data.user);

      if (!findUser) {
        client.disconnect();
        throw new UnauthorizedException('User do not found!');
      }

      if (liveUser && liveUser.length > 0) {
        server.to(String(findSenderSocket)).emit('message', {
          message: `Friend request rejected by "${findUser.data.first_name + ' ' + findUser.data.last_name}"`,
        });
      } else {
        // sender is not live
        client.emit('message', {
          status: 401,
          message: `${findUser.data.first_name + ' ' + findUser.data.last_name} rejected you request!`,
        });
      }

      this.friendReqService.updateFriendReqStatus(
        String(payload.requestId),
        FriendReqStatus.REJECTED,
      );

      // receviedFriendRequests remove into receiver;
      await this.userService.removeReceviedFriendReq(
        String(findReqest.receiver_id),
        payload.requestId,
      );
    } catch (error) {
      console.log(error);
    }
  }
}
