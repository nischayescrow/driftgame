import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { REDIS_CLIENT } from './modules/redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class AppService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async getHello() {
    await this.cacheManager.set('test1', 'testing...');
    await this.redis.set('test2', 'testing...');

    return 'Hello World!';
  }

  async getHello2() {
    const key1 = await this.cacheManager.get('test1');
    const key2 = await this.redis.get('test2');

    return { key1, key2 };
  }
}
