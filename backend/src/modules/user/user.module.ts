import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { FriendReq, FriendReqSchema } from './schemas/friendReq.schema';
import { FriendReqService } from './friendReq.service';
import { UserRepository } from './repositories/user.repository';
import { FriendReqRepository } from './repositories/friendRequest.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: FriendReq.name, schema: FriendReqSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    FriendReqService,
    UserRepository,
    FriendReqRepository,
  ],
  exports: [UserService, FriendReqService, MongooseModule],
})
export class UserModule {}
