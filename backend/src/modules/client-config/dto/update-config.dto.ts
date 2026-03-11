import { PartialType } from '@nestjs/mapped-types';
import { UnderMaintenanceDto } from './create-config.dto';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateRequired } from '../schemas/client-config.schema';

export class UpdateUnderMaintenanceDto extends PartialType(
  UnderMaintenanceDto,
) {}

export class UpdateClientConfigDto {
  @IsOptional()
  @IsNumber()
  clientBuildVersion?: number;

  @IsOptional()
  @IsEnum(UpdateRequired)
  updateRequired?: UpdateRequired;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUnderMaintenanceDto)
  underMaintenance?: UpdateUnderMaintenanceDto;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
