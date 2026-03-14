import { PartialType } from '@nestjs/mapped-types';
import {
  DriftTunningSettingDto,
  GamePlaySettingDto,
  GraphicsSettingDto,
  SoundSettingDto,
} from 'src/modules/game-setting/dto/create-game-setting.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AccelerationPaddle,
  GameControlType,
  Transmission,
} from '../schemas/game-setting.schema';

export class UpldateGamePlaySettingDto extends PartialType(
  GamePlaySettingDto,
) {}
export class UpldateGraphicsSettingDto extends PartialType(
  GraphicsSettingDto,
) {}
export class UpldateSoundSettingDto extends PartialType(SoundSettingDto) {}
export class UpldateDriftTunningSettingDto extends PartialType(
  DriftTunningSettingDto,
) {}

export class UpdateControlSettingDto {
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(AccelerationPaddle)
  acceleration_paddle?: AccelerationPaddle;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  sensitivity?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(10)
  @Max(100)
  char_look_sensitivity?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(10)
  @Max(100)
  char_camera_sensitivity?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(GameControlType)
  game_control_type?: GameControlType;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpldateDriftTunningSettingDto)
  drift_tunning?: UpldateDriftTunningSettingDto;
}

export class UpdateGameSettingDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GamePlaySettingDto)
  gameplay?: GamePlaySettingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateControlSettingDto)
  controls?: UpdateControlSettingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GraphicsSettingDto)
  graphics?: GraphicsSettingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SoundSettingDto)
  sound?: SoundSettingDto;
}
