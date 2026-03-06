import { Global, Module, Provider } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisClientFactory: Provider<Redis> = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const client = new Redis({
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT!),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'driftgame:',
    });

    client.on('connect', () => console.log('Connected Redis-Data'));
    client.on('error', (err) => console.log('Redis client error: ', err));

    return client;
  },
};

@Global()
@Module({
  controllers: [RedisController],
  providers: [redisClientFactory, RedisService],
  exports: [redisClientFactory, RedisService],
})
export class RedisModule {}
