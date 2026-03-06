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

export enum ClientConfigStatus {
  ACTIVE = 0,
  UPDATE_REQUIRED = 1,
}

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
  @IsEnum(ClientConfigStatus)
  updateRequired: ClientConfigStatus;

  @ValidateNested()
  @Type(() => UnderMaintenanceDto)
  underMaintenance: UnderMaintenanceDto;
}
