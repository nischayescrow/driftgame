import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Req,
  Res,
  UnauthorizedException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
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
  async loginWithGoogle(@Req() req: Request, @Res() res: Response) {
    const authCode = req.headers.authorization;

    console.log('authCode: ', authCode);

    if (!authCode) {
      throw new UnauthorizedException('Unauthorized request!');
    }

    const loginRes = await this.authService.loginWithGoogle(authCode);

    if (!loginRes || !loginRes.access_token || !loginRes.refresh_token) {
      throw new InternalServerErrorException('Failed to login!');
    }

    res.cookie('refresh_token', loginRes.refresh_token, {
      httpOnly: true,
      secure: process.env.APP_ENV! === 'production',
      sameSite: process.env.APP_ENV! === 'production' ? 'none' : 'strict',
      path: '/',
      expires: loginRes.refresh_token_expires,
    });

    return res.json({
      message: loginRes.message,
      access_token: loginRes.access_token,
      user: loginRes.user,
    });
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  async loginWithEmail(
    @Res() res: Response,
    @Body() emailLoginDto: EmailLoginDto,
  ) {
    const loginRes = await this.authService.loginWithEmail(emailLoginDto);

    console.log('loginRes: ', loginRes);

    if (!loginRes || !loginRes.access_token || !loginRes.refresh_token) {
      throw new InternalServerErrorException('Failed to login!');
    }

    res.cookie('refresh_token', loginRes.refresh_token, {
      httpOnly: true,
      secure: process.env.APP_ENV! === 'production',
      sameSite: process.env.APP_ENV! === 'production' ? 'none' : 'strict',
      path: '/',
      expires: loginRes.refresh_token_expires,
    });

    return res.json({
      message: loginRes.message,
      access_token: loginRes.access_token,
      user: loginRes.user,
    });
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refresh_token = req.cookies['refresh_token'];
    console.log('refresh_token', refresh_token);

    if (!refresh_token || !req.user || !req.session) {
      throw new UnauthorizedException('Session expired, Please login again!');
    }

    const refreshRes = await this.authService.refreshToken(
      refresh_token,
      req.user,
      req.session,
    );

    console.log('refreshRes: ', refreshRes);

    if (!refreshRes || !refreshRes.access_token || !refreshRes.refresh_token) {
      throw new InternalServerErrorException('Failed to refresh!');
    }

    res.cookie('refresh_token', refreshRes.refresh_token, {
      httpOnly: true,
      secure: process.env.APP_ENV! === 'production',
      sameSite: process.env.APP_ENV! === 'production' ? 'none' : 'strict',
      path: '/',
      expires: refreshRes.refresh_token_expires,
    });

    return res.json({
      message: refreshRes.message,
      access_token: refreshRes.access_token,
      user: refreshRes.user,
    });
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
