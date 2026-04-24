import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { randomBytes } from 'crypto';

export enum Role {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
}

@Schema({ _id: false })
export class MemberEntry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: Object.values(Role), required: true })
  role: Role;
}

export const MemberEntrySchema = SchemaFactory.createForClass(MemberEntry);

@Schema({ _id: false })
export class PendingInvite {
  @Prop({ required: true })
  email: string;

  @Prop({ enum: Object.values(Role), required: true })
  role: Role;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const PendingInviteSchema = SchemaFactory.createForClass(PendingInvite);

@Schema({ timestamps: true })
export class Board {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: false, index: true })
  archived: boolean;

  @Prop({ type: [MemberEntrySchema], default: [] })
  members: MemberEntry[];

  @Prop({ type: [PendingInviteSchema], default: [] })
  pendingInvites: PendingInvite[];

  @Prop({ type: [String], default: [] })
  cancelledInviteTokens: string[];

  @Prop({ type: [String], default: [] })
  usedInviteTokens: string[];

  @Prop({ type: String, default: null, index: true, sparse: true })
  shareToken: string | null;

  @Prop({ enum: Object.values(Role), default: Role.Viewer })
  shareRole: Role;
}

export const BoardSchema = SchemaFactory.createForClass(Board);

BoardSchema.index({ 'members.userId': 1 });
BoardSchema.index({ 'members.userId': 1, 'members.role': 1 });

export type BoardDocument = HydratedDocument<Board>;
