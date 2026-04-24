import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Label {
    @Prop({ type: Types.ObjectId, ref: 'Board', required: true, index: true })
    boardId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    color: string;
}

export const LabelSchema = SchemaFactory.createForClass(Label);
export type LabelDocument = HydratedDocument<Label>;
