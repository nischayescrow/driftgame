import { UserDocument } from '../../user/schemas/user.schema';
import { SessionHash } from '../auth.service';

export interface LoginUserRes {
  message: string;
  user: Partial<UserDocument>;
  access_token: string;
  refresh_token: string;
}

export interface verifySessionRes {
  session: SessionHash;
  user: UserDocument;
}

export interface TokenPayloadType {
  user_id: string;
  session_id: string;
}
