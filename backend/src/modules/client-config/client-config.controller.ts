import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientConfigService } from './client-config.service';
import { CreateClientConfigDto } from './dto/create-config.dto';
import { UpdateClientConfigDto } from './dto/update-config.dto';

@Controller('client-config')
export class ClientConfigController {
  constructor(private readonly clientConfigService: ClientConfigService) {}

  @Get('find/:id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id') id: string, @Query('all') all: boolean) {
    return this.clientConfigService.findById(id.trim(), all);
  }

  @Get('get/:version')
  @HttpCode(HttpStatus.OK)
  findByBuildVersion(
    @Param('version') version: string,
    @Query('all') all: boolean,
  ) {
    return this.clientConfigService.findByVersion(version.trim(), all);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClientConfigDto: CreateClientConfigDto) {
    return this.clientConfigService.create(createClientConfigDto);
  }

  @Patch('update/:id')
  @HttpCode(HttpStatus.OK)
  updateById(
    @Param('id') id: string,
    @Body() updateClientConfigDto: UpdateClientConfigDto,
  ) {
    return this.clientConfigService.updateById(
      id.trim(),
      updateClientConfigDto,
    );
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  deleteById(@Param('id') id: string) {
    return this.clientConfigService.deleteById(id.trim());
  }
}
