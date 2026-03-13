import * as express from 'express';
import { SessionHash } from 'src/modules/auth/auth.service';
import { findByIdResType } from 'src/modules/user/types/user.type';

declare global {
  namespace Express {
    interface Request {
      user?: findByIdResType;
      session?: SessionHash;
    }
  }
}
