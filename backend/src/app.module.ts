import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { createKeyv, Keyv } from '@keyv/redis';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RedisModule } from './modules/redis/redis.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthMiddleware } from './middlewares/auth/auth.middleware';
import { ClientConfigModule } from './modules/client-config/client-config.module';
import { SocketModule } from './modules/socket/socket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!, {
      onConnectionCreate: (connection: Connection) => {
        connection.on('connected', () => console.log('Connected to MongoDB!!'));

        connection.on('disconnected', () =>
          console.log('MongoDB disconnected'),
        );

        connection.on('error', (err) => console.log('MongoDB Error: ', err));
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const keyv = createKeyv(config.get<string>('REDIS_URI'), {
          namespace: 'driftgame-cache',
          keyPrefixSeparator: ':',
        });

        keyv.ttl = config.get<number>('CACHE_TTL');

        const redisClient = keyv.store.client;

        redisClient.on('connect', () =>
          console.log('Connecetd to Redis-Cache'),
        );

        redisClient.on('disconnect', () =>
          console.log('Redis DB disconnected!!'),
        );

        redisClient.on('error', (err: any) =>
          console.log('Redis DB error: ', err),
        );

        return {
          stores: [keyv],
        };
      },
    }),
    JwtModule.register({
      global: true,
    }),
    AuthModule,
    UserModule,
    RedisModule,
    ClientConfigModule,
    SocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login/{*splat}', method: RequestMethod.ALL },
        { path: 'auth/signup/{*splat}', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
