import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isObjectIdOrHexString, Model } from 'mongoose';
import { UpdateClientConfigDto } from './dto/update-config.dto';
import { CreateClientConfigDto } from './dto/create-config.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ClientConfig } from './schemas/client-config.schema';
import { ClientConfigRepository } from './repositories/client-config.repository';
import { ClientConfigProj } from './types/client-config.type';

@Injectable()
export class ClientConfigService {
  constructor(private readonly clientConfigRepo: ClientConfigRepository) {}

  private clientConfigProj: ClientConfigProj = {
    _id: 1,
    clientBuildVersion: 1,
    updateRequired: 1,
    underMaintenance: 1,
    createdAt: 1,
    updatedAt: 1,
  };

  async findById(id: string, all: boolean = false) {
    try {
      const findConfig = await this.clientConfigRepo.findById(
        id,
        all,
        this.clientConfigProj,
      );

      // console.log('findById', findConfig);

      if (!findConfig) {
        throw new NotFoundException('Client config do not found!');
      }

      return findConfig;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findByVersion(version: string, all: boolean = false) {
    try {
      const findConfig = await this.clientConfigRepo.findByBuildVer(
        parseInt(version),
      );

      // console.log('findById', findConfig);

      if (!findConfig) {
        throw new NotFoundException('Client config do not found!');
      }

      return findConfig;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async create(createClientConfigDto: CreateClientConfigDto) {
    try {
      const findConfig = await this.clientConfigRepo.findByBuildVer(
        createClientConfigDto.clientBuildVersion,
      );

      console.log('findConfig: ', findConfig);

      if (findConfig) {
        throw new BadRequestException(
          'Client config with that build version already exist!',
        );
      }

      await this.clientConfigRepo.create(createClientConfigDto);

      return {
        message: 'Client config created successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateById(id: string, updateClientConfigDto: UpdateClientConfigDto) {
    try {
      const findConfig = await this.findById(id, true);

      if (updateClientConfigDto.clientBuildVersion) {
        const findConfig = await this.clientConfigRepo.findByBuildVer(
          updateClientConfigDto.clientBuildVersion,
        );

        if (findConfig) {
          throw new BadRequestException(
            'Client config with same model already exist!',
          );
        }
      }

      if (updateClientConfigDto.underMaintenance) {
        updateClientConfigDto.underMaintenance = Object.assign(
          findConfig.underMaintenance,
          updateClientConfigDto.underMaintenance,
        );
      }

      await this.clientConfigRepo.update(id, updateClientConfigDto);

      await this.findById(id, true);

      return {
        message: 'Client config updated successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteById(id: string) {
    try {
      console.log('UpdateId: ', id);

      await this.updateById(id, { isDeleted: true });

      return {
        message: 'Client config deleted successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
