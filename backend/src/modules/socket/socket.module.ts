import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { FriendService } from './friend.service';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [SocketController],
  providers: [SocketService, SocketGateway, FriendService],
  exports: [SocketService, FriendService],
})
export class SocketModule {}
