import * as express from 'express';
import { SessionHash } from 'src/modules/auth/auth.service';
import { UserDocument } from 'src/modules/user/schemas/user.schema';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      session?: SessionHash;
    }
  }
}
