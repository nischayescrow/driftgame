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
export class LobbyService {
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
      const sender = await this.userService.findById(payload.sender_id);

      if (!sender) {
        client.emit('message', { message: 'Invalid Sender id!' });
        return;
      }

      const receiver = await this.userService.findById(payload.receiver_id);

      if (!receiver) {
        client.emit('message', { message: 'Invalid Receiver id!' });
        return;
      }

      if (receiver.friends.includes(sender._id)) {
        client.emit('message', { message: `User already in friends list` });
        return;
      }

      // if there is already pending request

      if (sender.sentFriendRequests && sender.sentFriendRequests.length > 0) {
        const exist = await Promise.all(
          sender.sentFriendRequests.map(async (r) => {
            const findReq = await this.friendReqService.findById(String(r));
            if (
              findReq &&
              String(findReq.receiver_id) === receiver.id &&
              findReq.status === FriendReqStatus.PENDING
            ) {
              return findReq;
            }
          }),
        );

        if (exist && exist.length > 0) {
          client.emit('message', {
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

        server.to(String(findReceiverSocket)).emit('friend-req', {
          requestId: friendRequest.id,
          message: `Friend request received from "${findUser.first_name + ' ' + findUser.last_name}"`,
        });

        await this.friendReqService.updateFriendReqStatus(
          String(friendRequest.id),
          FriendReqStatus.SENT,
        );

        console.log('friendRequest: ', friendRequest);

        client.emit('message', { message: `Friend request sent successfully` });
      } else {
        // Receiver is not live
        await this.friendReqService.updateFriendReqStatus(
          String(friendRequest.id),
          FriendReqStatus.PENDING,
        );

        client.emit('message', {
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
          message: `Friend request accepted by "${findUser.first_name + ' ' + findUser.last_name}"`,
        });
      } else {
        // sender is not live
        client.emit('message', {
          message: `${findUser.first_name + ' ' + findUser.last_name} is now your friend!`,
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
          message: `Friend request rejected by "${findUser.first_name + ' ' + findUser.last_name}"`,
        });
      } else {
        // sender is not live
        client.emit('message', {
          message: `${findUser.first_name + ' ' + findUser.last_name} rejected you request!`,
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
