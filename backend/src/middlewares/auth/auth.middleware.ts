import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from 'src/modules/auth/auth.service';
import { TokenService } from 'src/modules/auth/token.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
  ) {}

  async use(req: Request, res: Response, next: () => void) {
    try {
      const authorization = req.headers.authorization;
      const token = authorization?.split(' ')[1];
      const path = req.url;

      console.log('Middleware: ', path);
      console.log('authorization: ', authorization);

      if (
        !authorization ||
        authorization?.split(' ')[0] !== 'Bearer' ||
        !token
      ) {
        throw new UnauthorizedException();
      }

      const tokenDecoded = await this.tokenService.verifyAccessToken(token);

      if (
        !tokenDecoded ||
        !tokenDecoded.sub.session_id ||
        !tokenDecoded.sub.user_id
      ) {
        throw new UnauthorizedException();
      }

      // console.log('access_tokenDecoded: ', tokenDecoded);

      const userData = await this.authService.verifySession(
        tokenDecoded.sub.session_id,
        tokenDecoded.sub.user_id,
      );

      // console.log('userData: ', userData);

      if (!userData) {
        throw new UnauthorizedException(
          'No active session, please login again!',
        );
      }

      // console.log('Authenticated:userData: ', userData);

      req.user = userData.user;
      req.session = userData.session;

      next();
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
