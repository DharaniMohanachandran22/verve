import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: true })
export class ChecklistItem {
    @Prop({ required: true })
    text: string;

    @Prop({ default: false })
    completed: boolean;

    @Prop({ required: true })
    position: number;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    assignee?: Types.ObjectId;
}

export const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);

@Schema({ timestamps: true })
export class Checklist {
    @Prop({ type: Types.ObjectId, ref: 'Card', required: true, index: true })
    cardId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ type: [ChecklistItemSchema], default: [] })
    items: ChecklistItem[];
}

export const ChecklistSchema = SchemaFactory.createForClass(Checklist);
export type ChecklistDocument = HydratedDocument<Checklist>;
