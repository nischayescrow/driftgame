import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AccelerationPaddle,
  GameControlType,
  GameFPS,
  GameQuality,
  Language,
  ShadowResolution,
  SpeedUnit,
  SwitchStatus,
  TextureResolution,
  Transmission,
} from '../schemas/game-setting.schema';


export class GamePlaySettingDto {
  @IsNotEmpty()
  @IsEnum(SpeedUnit)
  speed_unit: SpeedUnit;

  @IsNotEmpty()
  @IsEnum(SwitchStatus)
  show_minimap: SwitchStatus;

  @IsNotEmpty()
  @IsEnum(Language)
  language: Language;
}

export class DriftTunningSettingDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  forward_grip: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  steering_grip: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  steering_angle: number;

  @IsNotEmpty()
  @IsEnum(SwitchStatus)
  dynamic_steering_grip: SwitchStatus;
}

export class ControlSettingDto {
  @IsNotEmpty()
  @IsEnum(AccelerationPaddle)
  acceleration_paddle: AccelerationPaddle;

  @IsNotEmpty()
  @IsEnum(Transmission)
  transmission: Transmission;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  sensitivity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(10)
  @Max(100)
  char_look_sensitivity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(10)
  @Max(100)
  char_camera_sensitivity: number;

  @IsNotEmpty()
  @IsEnum(GameControlType)
  game_control_type: GameControlType;

  @ValidateNested()
  @Type(() => DriftTunningSettingDto)
  drift_tunning: DriftTunningSettingDto;
}

export class GraphicsSettingDto {
  @IsNotEmpty()
  @IsEnum(GameQuality)
  graphics_quality: GameQuality;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  resolution: number;

  @IsNotEmpty()
  @IsEnum(GameFPS)
  game_fps: GameFPS;

  @IsNotEmpty()
  @IsEnum(TextureResolution)
  texture_resolution: TextureResolution;

  @IsNotEmpty()
  @IsEnum(ShadowResolution)
  shadow_resolution: ShadowResolution;

  @IsNotEmpty()
  @IsEnum(SwitchStatus)
  tone_map: SwitchStatus;

  @IsNotEmpty()
  @IsEnum(SwitchStatus)
  lut: SwitchStatus;

  @IsNotEmpty()
  @IsEnum(SwitchStatus)
  bloom: SwitchStatus;

  @IsNotEmpty()
  @IsEnum(SwitchStatus)
  vignet: SwitchStatus;

  @IsNotEmpty()
  @IsEnum(SwitchStatus)
  fps: SwitchStatus;
}

export class SoundSettingDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  master: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  music: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  sfx: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  engine: number;
}

export class CreateGameSettingDto {
  @ValidateNested()
  @Type(() => GamePlaySettingDto)
  gameplay: GamePlaySettingDto;

  @ValidateNested()
  @Type(() => ControlSettingDto)
  controls: ControlSettingDto;

  @ValidateNested()
  @Type(() => GraphicsSettingDto)
  graphics: GraphicsSettingDto;

  @ValidateNested()
  @Type(() => SoundSettingDto)
  sound: SoundSettingDto;
}
