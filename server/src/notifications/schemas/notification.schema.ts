import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum NotificationType {
    MENTION = 'MENTION',
    ASSIGNED = 'ASSIGNED',
    CARD_MOVED = 'CARD_MOVED',
    DUE_DATE_REMINDER = 'DUE_DATE_REMINDER',
    BOARD_INVITATION = 'BOARD_INVITATION',
    CARD_UPDATED = 'CARD_UPDATED',
}

@Schema({
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret: any) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
})
export class Notification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ enum: Object.values(NotificationType), required: true })
    type: NotificationType;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    actorId: Types.ObjectId;

    @Prop({ required: true })
    entityType: string;

    @Prop({ type: Types.ObjectId, required: true })
    entityId: Types.ObjectId;

    @Prop({ default: false, index: true })
    read: boolean;

    @Prop({ type: Object })
    metadata?: any;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = HydratedDocument<Notification>;
