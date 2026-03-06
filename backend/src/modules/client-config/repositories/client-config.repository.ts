import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model } from 'mongoose';
import {
  ClientConfig,
  ClientConfigDocument,
} from '../schemas/client-config.schema';
import { ClientConfigProj } from '../types/client-config.type';
import { UpdateClientConfigDto } from '../dto/update-config.dto';

@Injectable()
export class ClientConfigRepository {
  constructor(
    @InjectModel(ClientConfig.name)
    private clientConfigModel: Model<ClientConfigDocument>,
  ) {}

  async create(
    data: Partial<ClientConfigDocument>,
  ): Promise<ClientConfigDocument> {
    const config = new this.clientConfigModel(data);
    return await config.save();
  }

  async findByBuildVer(version: number): Promise<ClientConfigDocument | null> {
    return this.clientConfigModel.findOne({ clientBuildVersion: version });
  }

  async findById(
    id: string,
    all: boolean,
    clientConfigProj: ClientConfigProj,
  ): Promise<ClientConfigDocument | null> {
    const isObjectId = isObjectIdOrHexString(id);

    if (!isObjectId) {
      throw new BadRequestException('Invalid user id!');
    }

    // console.log('findById: ', id);

    const findQuery = all
      ? {
          _id: id,
        }
      : {
          _id: id,
          isDeleted: false,
        };

    return await this.clientConfigModel.findOne(findQuery, clientConfigProj);
  }

  async findAll(
    all: boolean,
    clientConfigProj: ClientConfigProj,
  ): Promise<ClientConfigDocument[]> {
    const findQuery = all
      ? {}
      : {
          isDeleted: false,
        };

    return await this.clientConfigModel.find(findQuery, clientConfigProj);
  }

  async update(
    id: string,
    data: UpdateClientConfigDto,
  ): Promise<UpdateClientConfigDto | null> {
    return await this.clientConfigModel.findByIdAndUpdate(id, data);
  }

  async delete(id: string): Promise<ClientConfigDocument | null> {
    return await this.clientConfigModel.findByIdAndDelete(id);
  }
}
