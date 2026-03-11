import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  Req,
  UnauthorizedException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('signup/google')
  @HttpCode(HttpStatus.CREATED)
  async signupWithGoogle(@Req() req: Request) {
    const authCode = req.headers.authorization;

    if (!authCode) {
      throw new UnauthorizedException('Unauthorized request!');
    }

    return this.authService.singupWithGoogle(authCode);
  }

  @Post('signup/email')
  @HttpCode(HttpStatus.CREATED)
  async signupWithEmail(@Body() createUserDto: CreateUserDto) {
    return this.authService.singupWithEmail(createUserDto);
  }

  @Get('login/google')
  @HttpCode(HttpStatus.OK)
  async loginWithGoogle(@Req() req: Request) {
    const authCode = req.headers.authorization;

    console.log('authCode: ', authCode);

    if (!authCode) {
      throw new UnauthorizedException('Unauthorized request!');
    }

    const loginRes = await this.authService.loginWithGoogle(authCode);

    if (!loginRes || !loginRes.access_token || !loginRes.refresh_token) {
      throw new InternalServerErrorException('Failed to login!');
    }

    return loginRes;
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  async loginWithEmail(@Body() emailLoginDto: EmailLoginDto) {
    const loginRes = await this.authService.loginWithEmail(emailLoginDto);

    console.log('loginRes: ', loginRes);

    if (!loginRes || !loginRes.access_token || !loginRes.refresh_token) {
      throw new InternalServerErrorException('Failed to login!');
    }

    return loginRes;
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request) {
    const authorization = req.headers.authorization;
    const refresh_token = authorization?.split(' ')[1];

    console.log('REFRESH TOKEN: ', authorization);

    if (
      !authorization ||
      authorization?.split(' ')[0] !== 'Bearer' ||
      !refresh_token
    ) {
      throw new UnauthorizedException();
    }

    const refreshRes = await this.authService.refreshToken(refresh_token);

    console.log('refreshRes: ', refreshRes);

    if (!refreshRes || !refreshRes.access_token || !refreshRes.refresh_token) {
      throw new InternalServerErrorException('Failed to refresh!');
    }

    return refreshRes;
  }

  @Get('logout')
  @HttpCode(HttpStatus.CREATED)
  async logoutUser(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('Session expired, Please login again!');
    }

    return this.authService.logout(req.user.id);
  }
}
