import { FriendReqStatus } from '../schemas/friendReq.schema';
import { UserStatus } from '../schemas/user.schema';

export interface UserProj {
  _id: 0 | 1;
  first_name: 0 | 1;
  last_name: 0 | 1;
  email: 0 | 1;
  password?: 0 | 1;
  email_verified?: 0 | 1;
  picture?: 0 | 1;
  status?: 0 | 1;
  friends?: 0 | 1;
  sentFriendRequests?: 0 | 1;
  receviedFriendRequests?: 0 | 1;
  createdAt?: 0 | 1;
  updatedAt?: 0 | 1;
}

export interface FriendReqType {
  id: string;
  sender: findByIdResType;
  receiver: findByIdResType;
  status: FriendReqStatus;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number | string;
}

export interface findByIdResType {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  email_verified?: boolean;
  picture?: string;
  status?: UserStatus;
  friends?: findByIdResType[];
  sentFriendRequests?: FriendReqType[];
  receviedFriendRequests?: FriendReqType[];
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserOnlineStatus {
  OFFLINE = 0,
  ONLINE = 1,
  IN_MATCH = 2,
}

export interface FrinedLiveStatusType {
  friend_id: string;
  liveStatus: UserOnlineStatus;
}
