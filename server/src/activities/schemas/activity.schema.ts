import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export enum ActionType {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    MOVE = 'MOVE',
    ARCHIVE = 'ARCHIVE',
    RESTORE = 'RESTORE',
    INVITE = 'INVITE',
    REMOVE_MEMBER = 'REMOVE_MEMBER',
    ADD_LABEL = 'ADD_LABEL',
    REMOVE_LABEL = 'REMOVE_LABEL',
    ASSIGN = 'ASSIGN',
    UNASSIGN = 'UNASSIGN',
    COMMENT = 'COMMENT',
    ATTACH = 'ATTACH',
    DETACH = 'DETACH',
}

export enum EntityType {
    BOARD = 'BOARD',
    LIST = 'LIST',
    CARD = 'CARD',
    COMMENT = 'COMMENT',
    MEMBER = 'MEMBER',
    LABEL = 'LABEL',
    ATTACHMENT = 'ATTACHMENT',
    CHECKLIST = 'CHECKLIST',
    CHECKLIST_ITEM = 'CHECKLIST_ITEM',
}

@Schema({ timestamps: true })
export class Activity {
    @Prop({ type: Types.ObjectId, ref: 'Board', required: true, index: true })
    boardId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Card', index: true })
    cardId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    actorId: Types.ObjectId;

    @Prop({ enum: Object.values(ActionType), required: true })
    actionType: ActionType;

    @Prop({ enum: Object.values(EntityType), required: true })
    entityType: EntityType;

    @Prop({ type: Types.ObjectId, required: true })
    entityId: Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.Mixed })
    metadata?: any;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index({ boardId: 1, createdAt: -1 });
ActivitySchema.index({ cardId: 1, createdAt: -1 });

export type ActivityDocument = HydratedDocument<Activity>;
