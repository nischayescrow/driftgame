import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export enum UserStatus {
  NOTACTIVE = 0,
  ACTIVE = 1,
  BLOCKED = 2,
  DELETED = 3,
}

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ type: String, required: true, trim: true })
  first_name: string;

  @Prop({ type: String, required: true, trim: true })
  last_name: string;

  @Prop({ type: String, required: true, unique: true, trim: true })
  email: string;

  @Prop({ type: String, required: false, trim: true })
  password: string;

  @Prop({ type: Boolean, default: false })
  email_verified: boolean;

  @Prop({ type: String, required: false })
  picture: string;

  @Prop({ type: Number, enum: UserStatus, default: UserStatus.NOTACTIVE })
  status: number;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }], default: [] })
  friends: Types.ObjectId[];

  @Prop({
    type: [{ type: SchemaTypes.ObjectId, ref: 'FriendReq' }],
    default: [],
  })
  sentFriendRequests: Types.ObjectId[];

  @Prop({
    type: [{ type: SchemaTypes.ObjectId, ref: 'FriendReq' }],
    default: [],
  })
  receviedFriendRequests: Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
