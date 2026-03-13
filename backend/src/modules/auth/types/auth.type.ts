import { findByIdResType } from 'src/modules/user/types/user.type';
import { UserDocument } from '../../user/schemas/user.schema';
import { SessionHash } from '../auth.service';

export interface LoginUserRes {
  message: string;
  user: findByIdResType;
  access_token: string;
  refresh_token: string;
}

export interface verifySessionRes {
  session: SessionHash;
  user: findByIdResType;
}

export interface TokenPayloadType {
  user_id: string;
  session_id: string;
  isRefreshToken?: boolean;
}
