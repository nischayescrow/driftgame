import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes, Types } from 'mongoose';

export enum SwitchStatus {
  OFF = 0,
  ON = 1,
}

export enum SpeedUnit {
  KMP = 0,
  MPH = 1,
}

export enum Language {
  HINDI = 'hi',
  ENGLISH = 'en',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  PORTUGUESE = 'pt',
  RUSSIAN = 'ru',
  ITALIAN = 'it',
  POLISH = 'pl',
  TURKISH = 'tr',
  ARABIC = 'ar',
  DUTCH = 'nl',
  INDONESIAN = 'id',
}

export enum AccelerationPaddle {
  STATIC = 0,
  PROGRRESSIVE = 1,
}

export enum Transmission {
  AUTOMATIC = 0,
  MANUAL = 1,
}

export enum GameControlType {
  STEERING = 0,
  BUTTONS = 1,
  TILT_TO_STEER = 2,
}

export enum GameQuality {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  ULTRA = 3,
}

export enum GameFPS {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  ULTRA = 3,
}

export enum TextureResolution {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
}

export enum ShadowResolution {
  OFF = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  ULTRA = 4,
}

@Schema({
  _id: false,
})
export class GamePlay {
  @Prop({ type: Number, enum: SpeedUnit, default: SpeedUnit.KMP })
  speed_unit: number;

  @Prop({ type: Number, enum: SwitchStatus, default: SwitchStatus.OFF })
  show_minimap: number;

  @Prop({ type: String, enum: Language, default: Language.ENGLISH })
  language: string;
}

@Schema({
  _id: false,
})
export class DriftTunning {
  @Prop({ type: Number, min: 0, max: 1, default: 0.75 })
  forward_grip: number;

  @Prop({ type: Number, min: 0, max: 1, default: 0.75 })
  steering_grip: number;

  @Prop({ type: Number, min: 0, max: 1, default: 0.75 })
  steering_angle: number;

  @Prop({ type: Number, enum: SwitchStatus, default: SwitchStatus.OFF })
  dynamic_steering_grip: number;
}

@Schema({
  _id: false,
})
export class Graphics {
  @Prop({ type: Number, enum: GameQuality, default: GameQuality.MEDIUM })
  graphics_quality: number;

  @Prop({ type: Number, min: 0, max: 100, default: 50 })
  resolution: number;

  @Prop({ type: Number, enum: GameFPS, default: GameFPS.MEDIUM })
  game_fps: number;

  @Prop({
    type: Number,
    enum: TextureResolution,
    default: TextureResolution.MEDIUM,
  })
  texture_resolution: number;

  @Prop({
    type: Number,
    enum: ShadowResolution,
    default: ShadowResolution.MEDIUM,
  })
  shadow_resolution: number;

  @Prop({ type: Number, enum: SwitchStatus, default: SwitchStatus.OFF })
  tone_map: number;

  @Prop({ type: Number, enum: SwitchStatus, default: SwitchStatus.OFF })
  lut: number;

  @Prop({ type: Number, enum: SwitchStatus, default: SwitchStatus.OFF })
  bloom: number;

  @Prop({ type: Number, enum: SwitchStatus, default: SwitchStatus.OFF })
  vignet: number;

  @Prop({ type: Number, enum: SwitchStatus, default: SwitchStatus.OFF })
  fps: number;
}

@Schema({
  _id: false,
})
export class Controls {
  @Prop({
    type: Number,
    enum: AccelerationPaddle,
    default: AccelerationPaddle.STATIC,
  })
  acceleration_paddle: number;

  @Prop({ type: Number, enum: Transmission, default: Transmission.AUTOMATIC })
  transmission: number;

  @Prop({ type: Number, min: 0, max: 100, default: 75 })
  sensitivity: number;

  @Prop({ type: Number, min: 10, max: 100, default: 75 })
  char_look_sensitivity: number;

  @Prop({ type: Number, min: 10, max: 100, default: 75 })
  char_camera_sensitivity: number;

  @Prop({
    type: Number,
    enum: GameControlType,
    default: GameControlType.STEERING,
  })
  game_control_type: number;

  @Prop({ type: DriftTunning })
  drift_tunning: DriftTunning;
}

@Schema({
  _id: false,
})
export class Sound {
  @Prop({ type: Number, min: 0, max: 100, default: 75 })
  master: number;

  @Prop({ type: Number, min: 0, max: 100, default: 75 })
  music: number;

  @Prop({ type: Number, min: 0, max: 100, default: 75 })
  sfx: number;

  @Prop({ type: Number, min: 0, max: 100, default: 75 })
  engine: number;
}

@Schema({
  collection: 'gameSetting',
  timestamps: true,
})
export class GameSetting extends Document {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    require: true,
    unique: true,
  })
  user_id: Types.ObjectId;

  @Prop({ type: GamePlay, required: true })
  gameplay: GamePlay;

  @Prop({ type: Controls })
  controls: Controls;

  @Prop({ type: Graphics })
  graphics: Graphics;

  @Prop({ type: Sound })
  sound: Sound;

  createdAt?: Date;
  updatedAt?: Date;
}

export type GameSettingDocument = HydratedDocument<GameSetting>;

export const GameSettingSchema = SchemaFactory.createForClass(GameSetting);
