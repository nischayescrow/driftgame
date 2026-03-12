import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes, Types } from 'mongoose';

@Schema({
  collection: 'gameOpenLog',
  timestamps: true,
})
export class GameOpenLog {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', require: true })
  user_id: Types.ObjectId;

  @Prop({ type: Date, required: true, unique: true })
  lastOpenedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type GameOpenLogDocument = HydratedDocument<GameOpenLog>;

export const GameOpenLogSchema = SchemaFactory.createForClass(GameOpenLog);
