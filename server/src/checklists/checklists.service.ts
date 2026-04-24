import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Checklist, ChecklistDocument } from './schemas/checklist.schema';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { AddChecklistItemDto } from './dto/add-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { BoardsService } from '../boards/boards.service';
import { Role } from '../boards/schemas/board.schema';
import { Card, CardDocument } from '../cards/schemas/card.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class ChecklistsService {
    constructor(
        @InjectModel(Checklist.name) private checklistModel: Model<ChecklistDocument>,
        @InjectModel(Card.name) private cardModel: Model<CardDocument>,
        private readonly boardsService: BoardsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    private async checkBoardPermission(boardId: string, userId: string, modification = false): Promise<void> {
        const board = await this.boardsService.getBoardForPermissionCheck(boardId);
        if (!board) throw new NotFoundException('Board not found');

        const member = board.members.find((m) => m.userId.toString() === userId);
        if (!member) throw new ForbiddenException('You are not a member of this board');

        if (modification && member.role === Role.Viewer) {
            throw new ForbiddenException('You do not have permission to modify checklists');
        }
    }

    async createChecklist(cardId: string, userId: string, dto: CreateChecklistDto): Promise<ChecklistDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        const checklist = new this.checklistModel({
            cardId: new Types.ObjectId(cardId),
            title: dto.title,
        });
        const saved = await checklist.save();

        // Notify watchers
        if (card.watchers && card.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                card.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                card._id.toString(),
                { title: card.title, action: 'added a checklist', checklistTitle: dto.title },
            );
        }

        return saved;
    }

    async addItem(checklistId: string, userId: string, dto: AddChecklistItemDto): Promise<ChecklistDocument> {
        const checklist = await this.checklistModel.findById(checklistId).exec();
        if (!checklist) throw new NotFoundException('Checklist not found');

        const card = await this.cardModel.findById(checklist.cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        let position = dto.position;
        if (position === undefined || position === null) {
            const lastItem = checklist.items[checklist.items.length - 1];
            position = lastItem ? lastItem.position + 1024 : 1024;
        }

        // @ts-ignore - mongoose subdocument push supports this
        checklist.items.push({
            text: dto.text,
            position,
            assignee: dto.assignee ? new Types.ObjectId(dto.assignee) : undefined
        });

        // Sort items by position
        checklist.items.sort((a, b) => a.position - b.position);

        const saved = await checklist.save();

        // Notify watchers
        if (card.watchers && card.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                card.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                card._id.toString(),
                { title: card.title, action: 'added an item to checklist', checklistTitle: checklist.title, itemText: dto.text },
            );
        }

        return saved;
    }

    async updateItem(checklistId: string, itemId: string, userId: string, dto: UpdateChecklistItemDto): Promise<ChecklistDocument> {
        const checklist = await this.checklistModel.findById(checklistId).exec();
        if (!checklist) throw new NotFoundException('Checklist not found');

        const card = await this.cardModel.findById(checklist.cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        const item = checklist.items.find((i: any) => i._id.toString() === itemId);
        if (!item) throw new NotFoundException('Checklist item not found');

        const wasCompleted = item.completed;
        if (dto.text !== undefined) item.text = dto.text;
        if (dto.completed !== undefined) item.completed = dto.completed;
        if (dto.assignee !== undefined) {
            item.assignee = dto.assignee ? new Types.ObjectId(dto.assignee as string) : undefined;
        }

        const saved = await checklist.save();

        // Notify watchers if item was completed/uncompleted
        if (dto.completed !== undefined && dto.completed !== wasCompleted && card.watchers && card.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                card.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                card._id.toString(),
                { title: card.title, action: dto.completed ? 'completed' : 'uncompleted', itemName: item.text },
            );
        }

        return saved;
    }

    async deleteItem(checklistId: string, itemId: string, userId: string): Promise<ChecklistDocument> {
        const checklist = await this.checklistModel.findById(checklistId).exec();
        if (!checklist) throw new NotFoundException('Checklist not found');

        const card = await this.cardModel.findById(checklist.cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        checklist.items = checklist.items.filter((i: any) => i._id.toString() !== itemId) as typeof checklist.items;
        return checklist.save();
    }

    async deleteChecklist(checklistId: string, userId: string): Promise<void> {
        const checklist = await this.checklistModel.findById(checklistId).exec();
        if (!checklist) throw new NotFoundException('Checklist not found');

        const card = await this.cardModel.findById(checklist.cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        await this.checkBoardPermission(card.boardId.toString(), userId, true);

        await this.checklistModel.deleteOne({ _id: checklistId }).exec();
    }

    calculateCompletionPercentage(checklist: ChecklistDocument): number {
        if (!checklist.items || checklist.items.length === 0) return 0;
        const completedCount = checklist.items.filter((i) => i.completed).length;
        return Math.round((completedCount / checklist.items.length) * 100);
    }
}
