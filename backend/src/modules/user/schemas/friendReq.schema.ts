import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export enum FriendReqStatus {
  NOTSEND = 0,
  SENT = 1,
  ACCEPTED = 2,
  REJECTED = 3,
  PENDING = 4,
}

@Schema({
  timestamps: true,
})
export class FriendReq {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  sender_id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  receiver_id: Types.ObjectId;

  @Prop({
    type: Number,
    enum: FriendReqStatus,
    default: FriendReqStatus.NOTSEND,
  })
  status: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export type FriendReqDocument = HydratedDocument<FriendReq>;

export const FriendReqSchema = SchemaFactory.createForClass(FriendReq);
