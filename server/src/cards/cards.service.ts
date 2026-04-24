import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Card, CardDocument, Priority } from './schemas/card.schema';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { AddLabelDto } from './dto/add-label.dto';
import { BoardsService } from '../boards/boards.service';
import { Role } from '../boards/schemas/board.schema';
import { List, ListDocument } from '../lists/schemas/list.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { Checklist, ChecklistDocument } from '../checklists/schemas/checklist.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Attachment, AttachmentDocument } from '../attachments/schemas/attachment.schema';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';

@Injectable()
export class CardsService {
    constructor(
        @InjectModel(Card.name) private cardModel: Model<CardDocument>,
        @InjectModel(List.name) private listModel: Model<ListDocument>,
        @InjectModel(Checklist.name) private checklistModel: Model<ChecklistDocument>,
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
        @InjectModel(Attachment.name) private attachmentModel: Model<AttachmentDocument>,
        @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
        private readonly boardsService: BoardsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    private async checkBoardPermission(boardId: string, userId: string, modification = false): Promise<void> {
        const board = await this.boardsService.getBoardForPermissionCheck(boardId);
        if (!board) throw new NotFoundException('Board not found');

        const member = board.members.find((m) => m.userId.toString() === userId);
        if (!member) throw new ForbiddenException('You are not a member of this board');

        if (modification && member.role === Role.Viewer) {
            throw new ForbiddenException('You do not have permission to modify cards');
        }
    }

    async createCard(listId: string, userId: string, dto: CreateCardDto): Promise<CardDocument> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, true);

        // Check for duplicate card name in the list
        const existingCard = await this.cardModel.findOne({
            listId: new Types.ObjectId(listId),
            title: { $regex: new RegExp(`^${dto.title}$`, 'i') },
            archived: false
        }).exec();

        if (existingCard) {
            throw new ConflictException(`A card with title "${dto.title}" already exists in this list`);
        }

        let position = dto.position;
        if (position === undefined || position === null) {
            const lastCard = await this.cardModel
                .findOne({ listId: new Types.ObjectId(listId) })
                .sort({ position: -1 })
                .exec();
            position = lastCard ? lastCard.position + 1024 : 1024;
        }

        const uId = new Types.ObjectId(userId);

        const card = new this.cardModel({
            listId: list._id,
            boardId: list.boardId,
            title: dto.title,
            description: dto.description || '',
            position,
            priority: dto.priority || Priority.Medium,
            createdBy: uId,
            watchers: [],
        });

        return card.save();
    }

    async findByListId(listId: string, userId: string): Promise<CardDocument[]> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, false);

        return this.cardModel
            .find({ listId: new Types.ObjectId(listId), archived: false })
            .sort({ position: 1 })
            .exec();
    }

    async findById(cardId: string, userId: string): Promise<any> {
        if (!Types.ObjectId.isValid(cardId)) {
            throw new NotFoundException('Card not found');
        }
        const card = await this.cardModel.findById(cardId).lean().exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, false);

        const [checklists, comments, attachments, activities] = await Promise.all([
            this.checklistModel.find({ cardId: new Types.ObjectId(cardId) }).lean().exec(),
            this.commentModel.find({ cardId: new Types.ObjectId(cardId) }).sort({ createdAt: -1 }).populate('authorId', 'name email').lean().exec(),
            this.attachmentModel.find({ cardId: new Types.ObjectId(cardId) }).lean().exec(),
            this.activityModel.find({ entityId: new Types.ObjectId(cardId) }).sort({ createdAt: -1 }).limit(50).lean().exec(),
        ]);

        return {
            ...card,
            id: (card._id as Types.ObjectId).toString(),
            checklists: checklists.map((cl) => ({
                ...cl,
                id: (cl._id as Types.ObjectId).toString(),
            })),
            comments: comments.map((c) => ({
                ...c,
                id: (c._id as Types.ObjectId).toString(),
                authorId: (c.authorId as any)?._id?.toString() ?? c.authorId.toString(),
                authorName: (c.authorId as any)?.name ?? null,
            })),
            attachments: attachments.map((a) => ({
                ...a,
                id: (a._id as Types.ObjectId).toString(),
            })),
            activities: activities.map((act) => ({
                ...act,
                id: (act._id as Types.ObjectId).toString(),
            })),
            watchers: (card.watchers || []).map((wId: Types.ObjectId) => wId.toString()),
        };
    }

    async searchInBoard(boardId: string, userId: string, q: string): Promise<any[]> {
        await this.checkBoardPermission(boardId, userId, false);

        const filter: any = {
            boardId: new Types.ObjectId(boardId),
            archived: false,
        };

        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
            ];
        }

        const cards = await this.cardModel
            .find(filter)
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean()
            .exec();

        return cards.map(card => ({
            ...card,
            id: (card._id as Types.ObjectId).toString(),
        }));
    }

    async findArchived(boardId: string, userId: string): Promise<any[]> {
        await this.checkBoardPermission(boardId, userId, false);

        const cards = await this.cardModel
            .find({ boardId: new Types.ObjectId(boardId), archived: true })
            .sort({ updatedAt: -1 })
            .lean()
            .exec();

        return cards.map(card => ({
            ...card,
            id: (card._id as Types.ObjectId).toString(),
        }));
    }

    async copyCard(cardId: string, userId: string, newTitle?: string): Promise<CardDocument> {
        const original = await this.cardModel.findById(cardId).exec();
        if (!original) throw new NotFoundException('Card not found');

        const titleToUse = newTitle || `${original.title} (copy)`;

        // Check for duplicate card name in the list
        const existingCard = await this.cardModel.findOne({
            listId: original.listId,
            title: { $regex: new RegExp(`^${titleToUse}$`, 'i') },
            archived: false
        }).exec();

        if (existingCard) {
            throw new ConflictException(`A card with title "${titleToUse}" already exists in this list`);
        }

        const position = (original.position || 0) + 1024;
        const newCard = new this.cardModel({
            listId: original.listId,
            boardId: original.boardId,
            title: titleToUse,
            description: original.description,
            position,
            createdBy: new Types.ObjectId(userId),
            priority: original.priority,
            labels: original.labels,
            dueDate: original.dueDate,
        });

        const saved = await newCard.save();

        // Copy checklists
        const checklists = await this.checklistModel.find({ cardId: original._id }).exec();
        for (const cl of checklists) {
            const newCl = new this.checklistModel({
                cardId: saved._id,
                title: cl.title,
                items: cl.items.map(item => ({ ...item })),
            });
            await newCl.save();
        }

        return saved;
    }

    async updateCard(cardId: string, userId: string, dto: UpdateCardDto): Promise<CardDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        if (dto.title !== undefined && dto.title !== card.title) {
            const existingCard = await this.cardModel.findOne({
                listId: card.listId,
                title: { $regex: new RegExp(`^${dto.title}$`, 'i') },
                archived: false,
                _id: { $ne: card._id }
            }).exec();

            if (existingCard) {
                throw new ConflictException(`A card with title "${dto.title}" already exists in this list`);
            }
            card.title = dto.title;
        }

        if (dto.description !== undefined) card.description = dto.description;

        if (dto.assignee !== undefined) {
            card.assignee = new Types.ObjectId(dto.assignee);
            const assigneeStr = new Types.ObjectId(dto.assignee).toString();
            if (!card.watchers.some(w => w.toString() === assigneeStr)) {
                card.watchers.push(new Types.ObjectId(dto.assignee));
            }
            if (assigneeStr !== userId) {
                await this.notificationsService.createNotification(
                    assigneeStr,
                    NotificationType.ASSIGNED,
                    userId,
                    'CARD',
                    card._id.toString(),
                    { title: card.title },
                );
            }
        }

        if (dto.dueDate !== undefined) card.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
        if (dto.priority !== undefined) card.priority = dto.priority;

        const updatedCard = await card.save();

        // Notify watchers
        if (updatedCard.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                updatedCard.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                updatedCard._id.toString(),
                { title: updatedCard.title, action: 'updated' },
            );
        }

        return updatedCard;
    }

    async moveCard(cardId: string, userId: string, dto: MoveCardDto): Promise<CardDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        const targetList = await this.listModel.findById(dto.listId).exec();
        if (!targetList) throw new NotFoundException('Target list not found');

        if (targetList.boardId.toString() !== card.boardId.toString()) {
            throw new BadRequestException('Cannot move card to a different board');
        }

        if (targetList._id.toString() !== card.listId.toString()) {
            // Check for duplicate title in the target list
            const existingCard = await this.cardModel.findOne({
                listId: targetList._id,
                title: { $regex: new RegExp(`^${card.title}$`, 'i') },
                archived: false,
                _id: { $ne: card._id }
            }).exec();

            if (existingCard) {
                throw new ConflictException(`A card with title "${card.title}" already exists in the target list`);
            }
        }

        card.listId = targetList._id as Types.ObjectId;

        card.position = dto.position ?? card.position;

        const movedCard = await card.save();

        // Notify watchers
        if (movedCard.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                movedCard.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                movedCard._id.toString(),
                { title: movedCard.title, action: 'moved', listName: targetList.name },
            );
        }

        return movedCard;
    }

    async archiveCard(cardId: string, userId: string): Promise<CardDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        card.archived = true;
        const archivedCard = await card.save();

        // Notify watchers
        if (archivedCard.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                archivedCard.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                archivedCard._id.toString(),
                { title: archivedCard.title, action: 'archived' },
            );
        }

        return archivedCard;
    }

    async restoreCard(cardId: string, userId: string): Promise<CardDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        card.archived = false;
        const restoredCard = await card.save();

        // Notify watchers
        if (restoredCard.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                restoredCard.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                restoredCard._id.toString(),
                { title: restoredCard.title, action: 'restored' },
            );
        }

        return restoredCard;
    }

    async addWatcher(cardId: string, userId: string): Promise<CardDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, false);

        if (!card.watchers.some(w => w.toString() === userId)) {
            card.watchers.push(new Types.ObjectId(userId));
        }
        return card.save();
    }

    async toggleWatcher(cardId: string, userId: string): Promise<CardDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, false);

        const index = card.watchers.findIndex(w => w.toString() === userId);
        if (index > -1) {
            card.watchers.splice(index, 1);
        } else {
            card.watchers.push(new Types.ObjectId(userId));
        }
        return card.save();
    }

    async removeWatcher(cardId: string, userId: string): Promise<CardDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, false);

        card.watchers = card.watchers.filter(w => w.toString() !== userId) as typeof card.watchers;
        return card.save();
    }

    async addLabel(cardId: string, userId: string, labelId: string): Promise<CardDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        if (!card.labels.some(l => l.toString() === labelId)) {
            card.labels.push(new Types.ObjectId(labelId));
        }
        const updatedCard = await card.save();

        // Notify watchers
        if (updatedCard.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                updatedCard.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                updatedCard._id.toString(),
                { title: updatedCard.title, action: 'label added' },
            );
        }

        return updatedCard;
    }

    async removeLabel(cardId: string, userId: string, labelId: string): Promise<CardDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        card.labels = card.labels.filter(l => l.toString() !== labelId) as typeof card.labels;
        const updatedCard = await card.save();

        // Notify watchers
        if (updatedCard.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                updatedCard.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                updatedCard._id.toString(),
                { title: updatedCard.title, action: 'label removed' },
            );
        }

        return updatedCard;
    }

    async deleteCard(cardId: string, userId: string): Promise<void> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        await this.cardModel.deleteOne({ _id: card._id }).exec();
    }
}
