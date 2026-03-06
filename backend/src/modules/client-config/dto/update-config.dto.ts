import { PartialType } from '@nestjs/mapped-types';
import {
  ClientConfigStatus,
  CreateClientConfigDto,
  UnderMaintenanceDto,
} from './create-config.dto';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUnderMaintenanceDto extends PartialType(
  UnderMaintenanceDto,
) {}

export class UpdateClientConfigDto {
  @IsOptional()
  @IsNumber()
  clientBuildVersion?: number;

  @IsOptional()
  @IsEnum(ClientConfigStatus)
  updateRequired?: ClientConfigStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUnderMaintenanceDto)
  underMaintenance?: UpdateUnderMaintenanceDto;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
