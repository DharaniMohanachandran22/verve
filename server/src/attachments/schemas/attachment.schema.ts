import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Attachment {
    @Prop({ type: Types.ObjectId, ref: 'Card', required: true, index: true })
    cardId: Types.ObjectId;

    @Prop({ required: true })
    filename: string;

    @Prop({ required: true })
    originalName: string;

    @Prop({ required: true })
    mimeType: string;

    @Prop({ required: true })
    size: number;

    @Prop({ required: true })
    path: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    uploadedBy: Types.ObjectId;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);
export type AttachmentDocument = HydratedDocument<Attachment>;
