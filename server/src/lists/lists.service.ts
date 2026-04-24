import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { List, ListDocument } from './schemas/list.schema';
import { Card, CardDocument } from '../cards/schemas/card.schema';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ReorderListDto } from './dto/reorder-list.dto';
import { BoardsService } from '../boards/boards.service';
import { Role } from '../boards/schemas/board.schema';

@Injectable()
export class ListsService {
    constructor(
        @InjectModel(List.name) private listModel: Model<ListDocument>,
        @InjectModel(Card.name) private cardModel: Model<CardDocument>,
        private readonly boardsService: BoardsService,
    ) { }

    private async checkBoardPermission(boardId: string, userId: string, allowedRoles?: Role[]): Promise<void> {
        const board = await this.boardsService.getBoardForPermissionCheck(boardId);
        if (!board) throw new NotFoundException('Board not found');

        const member = board.members.find((m) => m.userId.toString() === userId);
        if (!member) throw new ForbiddenException('You are not a member of this board');

        if (allowedRoles && allowedRoles.length > 0) {
            if (!allowedRoles.includes(member.role)) {
                throw new ForbiddenException('Insufficient permissions');
            }
        }
    }

    async createList(boardId: string, userId: string, dto: CreateListDto): Promise<ListDocument> {
        await this.checkBoardPermission(boardId, userId, [Role.Owner, Role.Editor]);

        const existingList = await this.listModel.findOne({
            boardId: new Types.ObjectId(boardId),
            name: { $regex: new RegExp(`^${dto.name}$`, 'i') },
            archived: false
        }).exec();

        if (existingList) {
            throw new ConflictException(`A list with name "${dto.name}" already exists on this board`);
        }

        let position = dto.position;
        if (position === undefined || position === null) {
            const lastList = await this.listModel
                .findOne({ boardId: new Types.ObjectId(boardId) })
                .sort({ position: -1 })
                .exec();
            position = lastList ? lastList.position + 1024 : 1024;
        }

        const list = new this.listModel({
            boardId: new Types.ObjectId(boardId),
            name: dto.name,
            position,
        });
        return list.save();
    }

    async findByBoardId(boardId: string, userId: string): Promise<ListDocument[]> {
        await this.checkBoardPermission(boardId, userId);

        return this.listModel
            .find({ boardId: new Types.ObjectId(boardId), archived: false })
            .sort({ position: 1 })
            .exec();
    }

    async updateList(listId: string, userId: string, dto: UpdateListDto): Promise<ListDocument> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, [Role.Owner, Role.Editor]);

        if (dto.name !== undefined && dto.name !== list.name) {
            const existingList = await this.listModel.findOne({
                boardId: list.boardId,
                name: { $regex: new RegExp(`^${dto.name}$`, 'i') },
                archived: false,
                _id: { $ne: list._id }
            }).exec();

            if (existingList) {
                throw new ConflictException(`A list with name "${dto.name}" already exists on this board`);
            }
            list.name = dto.name;
        }
        return list.save();
    }

    async reorderList(listId: string, userId: string, dto: ReorderListDto): Promise<ListDocument> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, [Role.Owner, Role.Editor]);

        list.position = dto.position;
        return list.save();
    }

    async archiveList(listId: string, userId: string): Promise<ListDocument> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, [Role.Owner, Role.Editor]);

        list.archived = true;
        return list.save();
    }

    async restoreList(listId: string, userId: string): Promise<ListDocument> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, [Role.Owner, Role.Editor]);

        list.archived = false;
        return list.save();
    }

    async copyList(listId: string, name: string, userId: string): Promise<ListDocument> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, [Role.Owner, Role.Editor]);

        const newName = name || `${list.name} (copy)`;

        const existingList = await this.listModel.findOne({
            boardId: list.boardId,
            name: { $regex: new RegExp(`^${newName}$`, 'i') },
            archived: false
        }).exec();

        if (existingList) {
            throw new ConflictException(`A list with name "${newName}" already exists on this board`);
        }

        const lastList = await this.listModel
            .findOne({ boardId: list.boardId })
            .sort({ position: -1 })
            .exec();
        const position = lastList ? lastList.position + 1024 : 1024;

        const newList = new this.listModel({
            boardId: list.boardId,
            name: newName,
            position,
        });
        const savedList = await newList.save();

        const originalCards = await this.cardModel.find({ listId: list._id, archived: false }).sort({ position: 1 }).exec();
        for (const card of originalCards) {
            const newCard = new this.cardModel({
                listId: savedList._id,
                boardId: card.boardId,
                title: card.title,
                description: card.description,
                position: card.position,
                createdBy: new Types.ObjectId(userId),
                priority: card.priority,
                labels: card.labels,
            });
            await newCard.save();
        }

        return savedList;
    }

    async moveAllCards(listId: string, targetListId: string, userId: string): Promise<void> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('Source list not found');

        const targetList = await this.listModel.findById(targetListId).exec();
        if (!targetList) throw new NotFoundException('Target list not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, [Role.Owner, Role.Editor]);

        if (list.boardId.toString() !== targetList.boardId.toString()) {
            throw new BadRequestException('Lists must be on the same board');
        }

        // Get max position in target list
        const lastCard = await this.cardModel.findOne({ listId: targetList._id }).sort({ position: -1 }).exec();
        let startPos = lastCard ? lastCard.position + 1024 : 1024;

        const cardsToMove = await this.cardModel.find({ listId: list._id, archived: false }).sort({ position: 1 }).exec();
        for (const card of cardsToMove) {
            card.listId = targetList._id as Types.ObjectId;
            card.position = startPos;
            startPos += 1024;
            await card.save();
        }
    }

    async toggleWatch(listId: string, userId: string): Promise<ListDocument> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId);

        const uId = new Types.ObjectId(userId);
        const index = list.watchers.findIndex(w => w.toString() === userId);
        const isWatching = index > -1;

        if (isWatching) {
            list.watchers.splice(index, 1);
            // Unwatch all cards in this list
            await this.cardModel.updateMany(
                { listId: list._id },
                { $pull: { watchers: uId } }
            );
        } else {
            list.watchers.push(uId);
            // Add to all cards in this list (ensure no duplicates)
            await this.cardModel.updateMany(
                { listId: list._id },
                { $addToSet: { watchers: uId } }
            );
        }
        return list.save();
    }

    async sortCards(listId: string, sortBy: 'newest' | 'oldest' | 'name', userId: string): Promise<void> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, [Role.Owner, Role.Editor]);

        let sortCriteria: any = {};
        if (sortBy === 'newest') sortCriteria = { createdAt: -1 };
        else if (sortBy === 'oldest') sortCriteria = { createdAt: 1 };
        else if (sortBy === 'name') sortCriteria = { title: 1 };

        const cards = await this.cardModel.find({ listId: list._id, archived: false }).sort(sortCriteria).exec();
        let pos = 1024;
        for (const card of cards) {
            card.position = pos;
            pos += 1024;
            await card.save();
        }
    }

    async findArchived(boardId: string, userId: string): Promise<any[]> {
        await this.checkBoardPermission(boardId, userId);

        const lists = await this.listModel
            .find({ boardId: new Types.ObjectId(boardId), archived: true })
            .sort({ updatedAt: -1 })
            .lean()
            .exec();

        return lists.map(list => ({
            ...list,
            id: (list._id as Types.ObjectId).toString(),
        }));
    }

    async deleteList(listId: string, userId: string): Promise<void> {
        const list = await this.listModel.findById(listId).exec();
        if (!list) throw new NotFoundException('List not found');

        await this.checkBoardPermission(list.boardId.toString(), userId, [Role.Owner]);

        // Delete all cards in list
        await this.cardModel.deleteMany({ listId: list._id }).exec();
        // Delete list
        await this.listModel.deleteOne({ _id: list._id }).exec();
    }
}
