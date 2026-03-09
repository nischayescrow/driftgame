import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { UserService } from '../user/user.service';
import { TokenService } from './token.service';
import { LoginUserRes, verifySessionRes } from './types/auth.type';
import { UserDocument, UserStatus } from '../user/schemas/user.schema';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';
import * as bcrypt from 'bcrypt';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { SocketStatus } from '../socket/socket.gateway';

export enum SessionStatus {
  BLOCKED = 0,
  ACTIVE = 1,
  LOGOUT = 2,
}

export interface SessionHash {
  session_id: string;
  user_id: string;
  socket_id?: string;
  socketStatus?: SocketStatus;
  hashedToken: string;
  status: number;
  createdAt: number;
  lastSeen?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async getUserDataGoogle(authCode: string) {
    const googleAccessTokenPayload = {
      code: authCode,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: 'postmessage',
      grant_type: 'authorization_code',
    };

    try {
      // Exchange Auth-code with Access_token
      const googleAccessTokenRes = await axios.post(
        'https://oauth2.googleapis.com/token',
        googleAccessTokenPayload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      console.log('googleAccessTokenRes: ', googleAccessTokenRes.data);

      if (
        !googleAccessTokenRes.data ||
        !googleAccessTokenRes.data.access_token
      ) {
        throw new InternalServerErrorException('Failed to login with google!');
      }

      // Get Userinfo from google
      const UserInfoRes = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${googleAccessTokenRes.data.access_token}`,
          },
        },
      );

      if (!UserInfoRes.data || !UserInfoRes.data.email) {
        throw new InternalServerErrorException('Failed to login with google!');
      }

      console.log('UserInfoRes: ', UserInfoRes.data);

      return UserInfoRes.data;
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }

    try {
    } catch (error) {}
  }

  async verifySession(
    session_id: string,
    user_id: string,
  ): Promise<verifySessionRes | null> {
    try {
      const findSession = (await this.redis.hgetall(
        `sessions:${user_id}`,
      )) as unknown as SessionHash;

      console.log('verifySession-findSession: ', findSession);

      if (
        !findSession ||
        findSession.session_id !== session_id ||
        Number(findSession.status) !== SessionStatus.ACTIVE
      ) {
        return null;
      }

      const findUser = await this.userService.findById(findSession.user_id);

      if (!findUser) {
        return null;
      }

      return {
        session: findSession,
        user: findUser,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async singupWithEmail(createUserDto: CreateUserDto) {
    try {
      // Create user
      const createUserRes = await this.userService.create(createUserDto);

      console.log('createUserRes: ', createUserRes);

      return {
        message: 'You have signed up successfully',
      };
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  async singupWithGoogle(authCode: string) {
    try {
      const userData = await this.getUserDataGoogle(authCode);

      // Create user
      const createUserRes = await this.userService.create({
        first_name: userData.given_name,
        last_name: userData.family_name,
        email: userData.email,
        email_verified: userData.email_verified,
        picture: userData.picture,
      });

      console.log('createUserRes: ', createUserRes);

      return createUserRes;
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  async loginWithGoogle(authCode: string): Promise<LoginUserRes> {
    try {
      const userData = await this.getUserDataGoogle(authCode);

      const findUser = await this.userService.findByEmail(userData.email);

      console.log('findUser: ', findUser);

      if (!findUser) {
        throw new BadRequestException('User is not registered!');
      }

      // const createSession = await this.createSession(findUser.id);
      const createdSession = randomUUID();

      console.log('storing session in redis');

      const access_token = await this.tokenService.signAccessToken({
        sub: {
          session_id: createdSession,
          user_id: findUser.id,
        },
      });

      const refresh_token = await this.tokenService.signRefreshToken({
        sub: {
          session_id: createdSession,
          user_id: findUser.id,
        },
      });

      const refresh_token_expires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      const refresh_token_hashed = await bcrypt.hash(refresh_token, 10);

      await this.redis.hset(`sessions:${findUser.id}`, {
        session_id: createdSession,
        user_id: findUser.id,
        hashedToken: refresh_token_hashed,
        status: SessionStatus.ACTIVE,
        createdAt: Date.now(),
      });

      await this.redis.pexpire(
        `sessions:${findUser.id}`,
        7 * 24 * 60 * 60 * 1000,
      );

      return {
        message: 'You have logged in successfully',
        user: {
          first_name: findUser.first_name,
          last_name: findUser.last_name,
          email: findUser.email,
          email_verified: findUser.email_verified,
          picture: findUser.picture,
          status: findUser.status,
          friends: findUser.friends,
          sentFriendRequests: findUser.sentFriendRequests,
          receviedFriendRequests: findUser.receviedFriendRequests,
          id: findUser.id,
          createdAt: findUser.createdAt,
          updatedAt: findUser.updatedAt,
        },
        access_token,
        refresh_token,
        refresh_token_expires,
      };
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  async loginWithEmail(emailLoginDto: EmailLoginDto): Promise<LoginUserRes> {
    try {
      const findUser = await this.userService.findByEmail(
        emailLoginDto.email,
        true,
        true,
      );

      if (!findUser) {
        throw new UnauthorizedException('Incorrect credentials!');
      }

      if (findUser.status !== UserStatus.ACTIVE) {
        switch (findUser.status) {
          case UserStatus.BLOCKED: {
            throw new BadRequestException('User account is blocked');
          }

          case UserStatus.DELETED: {
            throw new BadRequestException('User do not found');
          }

          case UserStatus.NOTACTIVE: {
            throw new BadRequestException('User account is not active');
          }
        }
      }

      if (!findUser.password) {
        throw new BadRequestException('User have not set any password!');
      }

      // check password here
      const isMatch = await bcrypt.compare(
        emailLoginDto.password,
        findUser.password,
      );

      if (!isMatch) {
        throw new UnauthorizedException('Incorrect credentials!');
      }

      // const createSession = await this.createSession(findUser.id);
      const createdSession = randomUUID();

      const access_token = await this.tokenService.signAccessToken({
        sub: {
          session_id: createdSession,
          user_id: findUser.id,
        },
      });

      const refresh_token = await this.tokenService.signRefreshToken({
        sub: {
          session_id: createdSession,
          user_id: findUser.id,
        },
      });

      const refresh_token_expires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      const refresh_token_hashed = await bcrypt.hash(refresh_token, 10);

      // console.log('refresh_token_hashed: ', refresh_token_hashed);

      await this.redis.hset(`sessions:${findUser.id}`, {
        session_id: createdSession,
        user_id: findUser.id,
        hashedToken: refresh_token_hashed,
        status: SessionStatus.ACTIVE,
        createdAt: Date.now(),
        expiresAt: refresh_token_expires,
      });

      await this.redis.pexpire(
        `sessions:${findUser.id}`,
        7 * 24 * 60 * 60 * 1000,
      );

      return {
        message: 'You have logged in successfully',
        user: {
          first_name: findUser.first_name,
          last_name: findUser.last_name,
          email: findUser.email,
          email_verified: findUser.email_verified,
          picture: findUser.picture,
          status: findUser.status,
          friends: findUser.friends,
          sentFriendRequests: findUser.sentFriendRequests,
          receviedFriendRequests: findUser.receviedFriendRequests,
          id: findUser.id,
          createdAt: findUser.createdAt,
          updatedAt: findUser.updatedAt,
        },
        access_token,
        refresh_token,
        refresh_token_expires,
      };
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  async logout(user_id: string) {
    try {
      await this.redis.del(`sessions:${user_id}`);

      return {
        message: 'User logout successfully',
      };
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  async refreshToken(
    refresh_token: string,
    user: UserDocument,
    session: SessionHash,
  ): Promise<LoginUserRes> {
    try {
      const refresh_token_decoded =
        await this.tokenService.verifyRefreshToken(refresh_token);

      const isMatch = await bcrypt.compare(refresh_token, session.hashedToken);

      if (!isMatch) {
        throw new UnauthorizedException();
      }

      const new_access_token = await this.tokenService.signAccessToken({
        sub: {
          session_id: session.session_id,
          user_id: user.id,
        },
      });

      const new_refresh_token = await this.tokenService.signRefreshToken({
        sub: {
          session_id: session.session_id,
          user_id: user.id,
        },
      });

      const refresh_token_hashed = await bcrypt.hash(new_refresh_token, 10);

      const refresh_token_expires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      await this.redis.hset(`sessions:${user.id}`, {
        session_id: session.session_id,
        user_id: user.id,
        hashedToken: refresh_token_hashed,
        status: SessionStatus.ACTIVE,
        createdAt: Date.now(),
        expiresAt: refresh_token_expires,
      });

      await this.redis.pexpire(`sessions:${user.id}`, 7 * 24 * 60 * 60 * 1000);

      return {
        message: 'You have logged in successfully',
        user: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          email_verified: user.email_verified,
          picture: user.picture,
          status: user.status,
          friends: user.friends,
          sentFriendRequests: user.sentFriendRequests,
          receviedFriendRequests: user.receviedFriendRequests,
          id: user.id,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        access_token: new_access_token,
        refresh_token: new_refresh_token,
        refresh_token_expires,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
