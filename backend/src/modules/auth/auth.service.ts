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
import { OAuth2Client } from 'google-auth-library';

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

      const findUser = await this.userService.findById(
        findSession.user_id,
        false,
        false,
        true,
        true,
        true,
      );

      if (!findUser) {
        return null;
      }

      return {
        session: findSession,
        user: findUser.data,
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

  async loginWithGoogle(authCode: string): Promise<LoginUserRes | any> {
    try {
      // Login with GOOGLE with id_token
      // const client = new OAuth2Client();

      // const token = await client.verifyIdToken({
      //   idToken: id_token,
      //   audience: process.env.GOOGLE_CLIENT_ID!,
      // });

      // const payload = token.getPayload();

      // console.log('GoogleUserData: ', payload);

      // return { ok: true };

      const userData = await this.getUserDataGoogle(authCode);

      console.log('userData: ', userData);

      const findUser = await this.userService.findByEmail(userData.email);

      console.log('findUser: ', findUser);

      if (!findUser) {
        throw new BadRequestException('User is not registered!');
      }

      if (findUser.data.status !== UserStatus.ACTIVE) {
        throw new BadRequestException('User account is not active!');
      }

      const createdSession = randomUUID();

      console.log('storing session in redis');

      const access_token = await this.tokenService.signAccessToken({
        session_id: createdSession,
        user_id: findUser.data.id,
      });

      const refresh_token = await this.tokenService.signRefreshToken({
        session_id: createdSession,
        user_id: findUser.data.id,
      });

      const refresh_token_expires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      const refresh_token_hashed = await bcrypt.hash(refresh_token, 10);

      await this.redis.hset(`sessions:${findUser.data.id}`, {
        session_id: createdSession,
        user_id: findUser.data.id,
        hashedToken: refresh_token_hashed,
        status: SessionStatus.ACTIVE,
        createdAt: Date.now(),
      });

      await this.redis.pexpire(
        `sessions:${findUser.data.id}`,
        7 * 24 * 60 * 60 * 1000,
      );

      return {
        message: 'You have logged in successfully',
        user: {
          first_name: findUser.data.first_name,
          last_name: findUser.data.last_name,
          email: findUser.data.email,
          email_verified: findUser.data.email_verified,
          picture: findUser.data.picture,
          status: findUser.data.status,
          friends: findUser.data.friends,
          id: findUser.data.id,
        },
        access_token,
        refresh_token,
      };
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  async loginWithEmail(emailLoginDto: EmailLoginDto): Promise<LoginUserRes> {
    try {
      let findUser = await this.userService.findByEmail(
        emailLoginDto.email,
        false,
        true,
      );

      if (!findUser) {
        throw new UnauthorizedException('Incorrect credentials!');
      }

      const findUserById = await this.userService.findById(
        findUser.data.id,
        false,
        false,
        true,
        true,
        true,
      );

      if (!findUserById) {
        throw new UnauthorizedException('Incorrect credentials!');
      }

      if (findUser.data.status !== UserStatus.ACTIVE) {
        throw new BadRequestException('User account is not active');
      }

      if (!findUser.data.password) {
        throw new BadRequestException(
          'You have not set any password, try login with Google!',
        );
      }

      // check password here
      const isMatch = await bcrypt.compare(
        emailLoginDto.password,
        findUser.data.password,
      );

      if (!isMatch) {
        throw new UnauthorizedException('Incorrect credentials!');
      }

      const createdSession = randomUUID();

      const access_token = await this.tokenService.signAccessToken({
        session_id: createdSession,
        user_id: findUser.data.id,
      });

      const refresh_token = await this.tokenService.signRefreshToken({
        session_id: createdSession,
        user_id: findUser.data.id,
      });

      const refresh_token_expires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      const aceess_token_hashed = await bcrypt.hash(access_token, 10);
      const refresh_token_hashed = await bcrypt.hash(refresh_token, 10);

      console.log('aceess_token_hashed: ', aceess_token_hashed);
      console.log('refresh_token_hashed: ', refresh_token_hashed);

      await this.redis.hset(`sessions:${findUser.data.id}`, {
        session_id: createdSession,
        user_id: findUser.data.id,
        hashedToken: refresh_token_hashed,
        status: SessionStatus.ACTIVE,
        createdAt: Date.now(),
        expiresAt: refresh_token_expires,
      });

      await this.redis.pexpire(
        `sessions:${findUser.data.id}`,
        7 * 24 * 60 * 60 * 1000,
      );

      return {
        message: 'You have logged in successfully',
        user: {
          id: findUserById.data.id,
          first_name: findUserById.data.first_name,
          last_name: findUserById.data.last_name,
          email: findUserById.data.email,
          email_verified: findUserById.data.email_verified,
          picture: findUserById.data.picture,
          status: findUserById.data.status,
          friends: findUserById.data.friends,
          sentFriendRequests: findUserById.data.sentFriendRequests,
          receviedFriendRequests: findUserById.data.receviedFriendRequests,
          createdAt: findUserById.data.createdAt,
        },
        access_token,
        refresh_token,
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

  async refreshToken(refresh_token: string): Promise<LoginUserRes> {
    try {
      const tokenDecoded =
        await this.tokenService.verifyRefreshToken(refresh_token);

      if (!tokenDecoded || !tokenDecoded.session_id || !tokenDecoded.user_id) {
        throw new UnauthorizedException();
      }

      console.log('refresh_tokenDecoded: ', tokenDecoded);

      const userData = await this.verifySession(
        tokenDecoded.session_id,
        tokenDecoded.user_id,
      );

      console.log('userData: ', userData);

      if (!userData) {
        throw new UnauthorizedException(
          'No active session, please login again!',
        );
      }

      const isMatch = await bcrypt.compare(
        refresh_token,
        userData.session.hashedToken,
      );

      if (!isMatch) {
        throw new UnauthorizedException();
      }

      const new_access_token = await this.tokenService.signAccessToken({
        session_id: userData.session.session_id,
        user_id: userData.user.id,
      });

      const new_refresh_token = await this.tokenService.signRefreshToken({
        session_id: userData.session.session_id,
        user_id: userData.user.id,
      });

      const refresh_token_hashed = await bcrypt.hash(new_refresh_token, 10);

      const refresh_token_expires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      await this.redis.hset(`sessions:${userData.user.id}`, {
        session_id: userData.session.session_id,
        user_id: userData.user.id,
        hashedToken: refresh_token_hashed,
        status: SessionStatus.ACTIVE,
        createdAt: Date.now(),
        expiresAt: refresh_token_expires,
      });

      await this.redis.pexpire(
        `sessions:${userData.user.id}`,
        7 * 24 * 60 * 60 * 1000,
      );

      return {
        message: 'You have logged in successfully',
        user: {
          id: userData.user.id,
          first_name: userData.user.first_name,
          last_name: userData.user.last_name,
          email: userData.user.email,
          email_verified: userData.user.email_verified,
          picture: userData.user.picture,
          status: userData.user.status,
          friends: userData.user.friends,
          sentFriendRequests: userData.user.sentFriendRequests,
          receviedFriendRequests: userData.user.receviedFriendRequests,
          createdAt: userData.user.createdAt,
        },
        access_token: new_access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
