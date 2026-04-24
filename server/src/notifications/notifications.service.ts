import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    ) { }

    async createNotification(
        userId: string,
        type: NotificationType,
        actorId: string,
        entityType: string,
        entityId: string,
        metadata?: any,
    ): Promise<NotificationDocument> {
        const notification = new this.notificationModel({
            userId: new Types.ObjectId(userId),
            type,
            actorId: new Types.ObjectId(actorId),
            entityType,
            entityId: new Types.ObjectId(entityId),
            read: false,
            metadata,
        });
        return notification.save();
    }

    async notifyMany(
        userIds: string[],
        type: NotificationType,
        actorId: string,
        entityType: string,
        entityId: string,
        metadata?: any,
    ): Promise<void> {
        const notifications = userIds
            .filter(userId => userId !== actorId) // Don't notify the actor
            .map(userId => ({
                userId: new Types.ObjectId(userId),
                type,
                actorId: new Types.ObjectId(actorId),
                entityType,
                entityId: new Types.ObjectId(entityId),
                read: false,
                metadata,
            }));

        if (notifications.length > 0) {
            await this.notificationModel.insertMany(notifications);
        }
    }

    async findForUser(userId: string): Promise<NotificationDocument[]> {
        return this.notificationModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('actorId', 'name email')
            .exec();
    }

    async markAsRead(notificationId: string, userId: string): Promise<void> {
        const notification = await this.notificationModel.findById(notificationId).exec();
        if (!notification) throw new NotFoundException('Notification not found');
        if (notification.userId.toString() !== userId) throw new ForbiddenException('Unauthorized access');

        notification.read = true;
        await notification.save();
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationModel
            .updateMany(
                { userId: new Types.ObjectId(userId), read: false },
                { $set: { read: true } },
            )
            .exec();
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationModel.countDocuments({
            userId: new Types.ObjectId(userId),
            read: false,
        }).exec();
    }
}
