import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import type { Cache } from 'cache-manager';
import Redis from 'ioredis';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { AuthService } from '../../modules/auth/auth.service';
import { TokenService } from '../../modules/auth/token.service';
import { REDIS_CLIENT } from '../../modules/redis/redis.module';

export abstract class BaseWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @Inject(TokenService) private readonly tokenService: TokenService;
  @Inject(AuthService) private readonly authService: AuthService;
  @Inject(REDIS_CLIENT) private readonly redis: Redis;
  @Inject(CACHE_MANAGER) private cacheManager: Cache;

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake?.auth?.token;

      console.log('token: ', token);

      if (!token) {
        client.emit('message', { server: '401:Unauthorized request!' });
        client.disconnect();
        // throw new UnauthorizedException();
        return;
      }

      const tokenDecoded = await this.tokenService.verifyAccessToken(
        String(token),
      );

      console.log(tokenDecoded);

      if (!tokenDecoded || !tokenDecoded.session_id || !tokenDecoded.user_id) {
        client.emit('message', { message: '401:Unauthorized request!' });
        client.disconnect();
        return;
        // throw new UnauthorizedException();
      }

      const userData = await this.authService.verifySession(
        tokenDecoded.session_id,
        tokenDecoded.user_id,
      );

      if (!userData) {
        client.emit('message', {
          message: 'No active session, please login again!',
        });
        client.disconnect();
        return;
      }

      console.log('userData: ', userData);

      client.data.user = userData.user;

      console.log('Socket-Connection:Authenticated');
      console.log('Client connected: ', client.id);

      await this.cacheManager.set(
        `users:${client.data.user._id}:Socket`,
        client.id,
      );

      // client.emit('message', { server: 'Connected successfully' });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      await this.cacheManager.del(`users:${client.data.user._id}:Socket`);
      const session_id = await this.cacheManager.get(
        `users:${client.data.user._id}:Session`,
      );
      if (session_id) await this.authService.logout(client.data.user);
      delete client.data.user;
      console.log('Client disconnected: ', client.id);
    } catch (error) {
      console.log(error);
      client.disconnect();
    }
  }
}
