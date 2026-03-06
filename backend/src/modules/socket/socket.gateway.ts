import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';
import Redis from 'ioredis';
import type { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { LobbyService } from './lobby.service';

export enum SocketStatus {
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected',
}

@WebSocketGateway({
  cors: true,
  namespace: '/socket',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(LobbyService) private readonly lobbyService: LobbyService,
  ) {}

  @WebSocketServer()
  private server: Server;

  private playerStatusTime: any;

  // <=================== Redis operations ===================>
  async addUserIntoRedis(socket_id: string, user_id: string) {
    // Redis:userData
    await this.redis.hset(`sessions:${user_id}`, {
      socket_id: socket_id,
      socketStatus: SocketStatus.CONNECTED,
      lastSeen: Date.now(),
    });

    await this.redis.hexpire(
      `sessions:${user_id}`,
      20,
      'FIELDS',
      3,
      'socket_id',
      'socketStatus',
      'lastSeen',
    );

    // Redis:Socket
    await this.redis.set(`sockets:${socket_id}`, user_id, 'EX', 20);

    //Redis:online total users
    await this.redis.set(`online:${user_id}`, user_id);
  }

  async removeUser(client: Socket) {
    if (client) client.disconnect();

    //Clear Redis:userData
    await this.redis.hdel(
      `sessions:${client?.data.user}`,
      'socket_id',
      'socketStatus',
      'lastSeen',
    );

    //Clear Redis:Socket
    await this.redis.del(`sockets:${client?.id}`);

    //Clear Redis:online total users
    await this.redis.del(`online:${client?.data.user}`);

    delete client?.data.user;
  }

  //<=================== Socket Connection methods ===================>
  async handleConnection(client: Socket) {
    try {
      //<================ User Authentication ================>
      const token =
        client.handshake?.auth?.token || client.handshake?.headers?.auth;

      console.log('token: ', token);

      if (!token) {
        client.emit('message', { server: '401:Unauthorized request!' });
        client.disconnect();
        return;
      }

      const tokenDecoded = await this.tokenService.verifyAccessToken(
        String(token),
      );

      console.log(tokenDecoded);

      if (
        !tokenDecoded ||
        !tokenDecoded.sub.session_id ||
        !tokenDecoded.sub.user_id
      ) {
        client.emit('message', { server: '401:Unauthorized request!' });
        client.disconnect();
        return;
      }

      const userData = await this.authService.verifySession(
        tokenDecoded.sub.session_id,
        tokenDecoded.sub.user_id,
      );

      if (!userData) {
        client.emit('message', {
          message: 'No active session, please login again!',
        });
        client.disconnect();
        return;
      }
      console.log('userData: ', userData);

      client.data.user = userData.user.id;

      // Only one user per session
      const oldUserSession = await this.redis.hget(
        `sessions:${client.data.user}`,
        'session_id',
      );

      if (oldUserSession) {
        console.log('User reconnected!!');
        const oldUserSocket = await this.redis.hget(
          `sessions:${client.data.user}`,
          'socket_id',
        );

        const sockets = await this.server.fetchSockets();

        const targetSocket = sockets.find((s) => s.id === oldUserSocket);

        if (targetSocket) targetSocket.disconnect();
      }

      // Add user to redis
      await this.addUserIntoRedis(client.id, client.data.user);

      console.log('Client connected: ', client.id);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      console.log('Client disconnected: ', client?.id);

      // Redis:userData disconnected
      await this.redis.hset(
        `sessions:${client?.data.user}`,
        'socketStatus',
        SocketStatus.DISCONNECTED,
      );

      this.playerStatusTime = setTimeout(async () => {
        await this.removeUser(client);
      }, 20000);
    } catch (error) {
      console.log(error);
      client?.disconnect();
    }
  }

  //<=================== Lobby Events ===================>
  @SubscribeMessage('player:connected')
  async playerConnecte(client: Socket, payload: any) {
    clearTimeout(this.playerStatusTime);

    console.log('checking player status...');

    const session = await this.redis.hget(
      `sessions:${client.data.user}`,
      'socket_id',
    );

    if (!session) {
      await this.removeUser(client);
      return;
    }

    // update user with new TTL to redis
    await this.addUserIntoRedis(client.id, client.data.user);

    this.playerStatusTime = setTimeout(async () => {
      await this.removeUser(client);
      client.emit('player:logout');
    }, 20000);

    console.log('player:connected');

    return { ok: true };
  }

  @SubscribeMessage('lobby:friendRequest:sent')
  async sentFriendReq(
    client: Socket,
    payload: { sender_id: string; receiver_id: string },
  ) {
    await this.lobbyService.sentFriendReq(client, this.server, payload);
    return { ok: true };
  }

  @SubscribeMessage('lobby:friendRequest:accepted')
  async invitationAccepted(client: Socket, payload: { requestId: string }) {
    await this.lobbyService.friendReqAccepted(client, this.server, payload);
    return { ok: true };
  }

  @SubscribeMessage('lobby:friendRequest:rejected')
  async invitationRejected(client: Socket, payload: { requestId: string }) {
    await this.lobbyService.friendReqRejected(client, this.server, payload);
    return { ok: true };
  }
}
