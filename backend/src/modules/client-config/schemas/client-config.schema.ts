import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export enum UpdateRequired {
  NOT_REQUIRED = 0,
  UPDATE_REQUIRED = 1,
}

@Schema({ _id: false })
export class UnderMaintenance {
  @Prop({ type: Boolean, required: true })
  currentStatus: boolean;

  @Prop({ type: Boolean, required: true })
  upcomingStatus: boolean;

  @Prop({ type: String, required: true })
  message: string;
}

@Schema({
  collection: 'masterClientBuildConfig',
  timestamps: true,
})
export class ClientConfig extends Document {
  @Prop({ type: Number, required: true, unique: true, trim: true })
  clientBuildVersion: number;

  @Prop({
    type: Number,
    enum: UpdateRequired,
    default: UpdateRequired.NOT_REQUIRED,
  })
  updateRequired: number;

  @Prop({ type: UnderMaintenance })
  underMaintenance: UnderMaintenance;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ClientConfigDocument = HydratedDocument<ClientConfig>;

export const ClientConfigSchema = SchemaFactory.createForClass(ClientConfig);
