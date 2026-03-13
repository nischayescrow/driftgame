import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('find/:id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id') id: string,
    @Query('all') all: boolean,
    @Query('pass') pass: boolean,
    @Query('friends') friends: boolean,
    @Query('sentReq') pasentReqss: boolean,
    @Query('receiveReq') receiveReq: boolean,
  ) {
    const findUser = await this.userService.findById(
      id.trim(),
      all,
      pass,
      friends,
      pasentReqss,
      receiveReq,
    );

    if (!findUser) throw new NotFoundException('User do not found!');

    return findUser;
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  searchUser(
    @Query('text') text: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('all') all: boolean,
    @Query('pass') pass: boolean,
  ) {
    return this.userService.search(text, limit, page, all, pass);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Patch('update/:id')
  @HttpCode(HttpStatus.OK)
  updateById(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateById(id.trim(), updateUserDto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  deleteById(@Param('id') id: string) {
    return this.userService.deleteById(id.trim());
  }

  @Get('friends/status')
  @HttpCode(HttpStatus.OK)
  async getFriendsLiveStatus(@Req() req: Request) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException();
    }
    return await this.userService.getFriendsOnlineStatus(req.user.id);
  }
}
