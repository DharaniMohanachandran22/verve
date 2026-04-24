import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum Priority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Urgent = 'Urgent',
}

@Schema({ timestamps: true })
export class Card {
    @Prop({ type: Types.ObjectId, ref: 'List', required: true, index: true })
    listId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Board', required: true, index: true })
    boardId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ default: '' })
    description: string;

    @Prop({ required: true })
    position: number;

    @Prop({ type: Types.ObjectId, ref: 'User', index: true })
    assignee?: Types.ObjectId;

    @Prop({ type: Date, index: true })
    dueDate?: Date;

    @Prop({ enum: Object.values(Priority) })
    priority?: Priority;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Label' }], default: [] })
    labels: Types.ObjectId[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    watchers: Types.ObjectId[];

    @Prop({ default: false, index: true })
    archived: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}

export const CardSchema = SchemaFactory.createForClass(Card);
export type CardDocument = HydratedDocument<Card>;
