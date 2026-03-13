import { findByIdResType } from 'src/modules/user/types/user.type';
import { SocketStatus } from 'src/modules/socket/socket.gateway';

export interface LoginUserRes {
  message: string;
  user: findByIdResType;
  access_token: string;
  refresh_token: string;
}

export interface TokenPayloadType {
  user_id: string;
  session_id: string;
  isRefreshToken?: boolean;
}

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

export interface verifySessionRes {
  session: SessionHash;
  user: findByIdResType;
}
