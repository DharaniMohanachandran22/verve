import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument, ActionType, EntityType } from './schemas/activity.schema';

@Injectable()
export class ActivitiesService {
    constructor(
        @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
    ) { }

    async logActivity(
        boardId: string,
        actorId: string,
        actionType: ActionType,
        entityType: EntityType,
        entityId: string,
        cardId?: string,
        metadata?: any,
    ): Promise<ActivityDocument> {
        const activity = new this.activityModel({
            boardId: new Types.ObjectId(boardId),
            actorId: new Types.ObjectId(actorId),
            actionType,
            entityType,
            entityId: new Types.ObjectId(entityId),
            cardId: cardId ? new Types.ObjectId(cardId) : undefined,
            metadata,
        });
        return activity.save();
    }

    async findByBoardId(boardId: string): Promise<ActivityDocument[]> {
        return this.activityModel
            .find({ boardId: new Types.ObjectId(boardId) })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('actorId', 'name email')
            .exec();
    }

    async findByCardId(cardId: string): Promise<ActivityDocument[]> {
        return this.activityModel
            .find({ cardId: new Types.ObjectId(cardId) })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('actorId', 'name email')
            .exec();
    }
}
