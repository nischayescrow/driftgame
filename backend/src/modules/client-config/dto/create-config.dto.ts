import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateRequired } from '../schemas/client-config.schema';

export class UnderMaintenanceDto {
  @IsNotEmpty()
  @IsBoolean()
  currentStatus: boolean;

  @IsNotEmpty()
  @IsBoolean()
  upcomingStatus: boolean;

  @IsNotEmpty()
  @IsString()
  message: string;
}

export class CreateClientConfigDto {
  @IsNotEmpty()
  @IsNumber()
  clientBuildVersion: number;

  @IsNotEmpty()
  @IsEnum(UpdateRequired)
  updateRequired: UpdateRequired;

  @ValidateNested()
  @Type(() => UnderMaintenanceDto)
  underMaintenance: UnderMaintenanceDto;
}
