import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class List {
    @Prop({ type: Types.ObjectId, ref: 'Board', required: true, index: true })
    boardId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, index: true })
    position: number;

    @Prop({ default: false, index: true })
    archived: boolean;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    watchers: Types.ObjectId[];
}

export const ListSchema = SchemaFactory.createForClass(List);

export type ListDocument = HydratedDocument<List>;
