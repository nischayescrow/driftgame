import { Module } from '@nestjs/common';
import { ClientConfigService } from './client-config.service';
import { ClientConfigController } from './client-config.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ClientConfig,
  ClientConfigSchema,
} from './schemas/client-config.schema';
import { ClientConfigRepository } from './repositories/client-config.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClientConfig.name, schema: ClientConfigSchema },
    ]),
  ],
  controllers: [ClientConfigController],
  providers: [ClientConfigService, ClientConfigRepository],
})
export class ClientConfigModule {}
