import { Injectable } from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: any) {
    const access_token = await this.jwtService.signAsync(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: process.env.ACCESS_EXPIRES_AT_MS! as any,
    });

    return access_token;
  }

  async signRefreshToken(payload: any) {
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: process.env.REFRESH_EXPIRES_AT_MS! as any,
    });

    return refresh_token;
  }

  async verifyAccessToken(token: string) {
    try {
      const access_token_decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      return access_token_decoded;
    } catch (error) {
      if (
        error instanceof TokenExpiredError ||
        error instanceof JsonWebTokenError
      ) {
        return null;
      }
      throw error;
    }
  }

  async verifyRefreshToken(token: string) {
    try {
      const refresh_token_decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      return refresh_token_decoded;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return null;
      }
      throw error;
    }
  }
}
