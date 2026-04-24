import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Card, CardDocument } from '../cards/schemas/card.schema';
import { BoardsService } from '../boards/boards.service';
import { SearchCardsDto, FilterCardsDto } from './dto/search-filter.dto';

@Injectable()
export class SearchService {
    constructor(
        @InjectModel(Card.name) private readonly cardModel: Model<CardDocument>,
        private readonly boardsService: BoardsService,
    ) { }

    private async checkBoardPermission(boardId: string, userId: string): Promise<void> {
        const board = await this.boardsService.getBoardForPermissionCheck(boardId);
        if (!board) throw new NotFoundException('Board not found');
        const isMember = board.members.some((m) => m.userId.toString() === userId);
        if (!isMember) throw new ForbiddenException('Not a member of the board');
    }

    async searchCards(boardId: string, userId: string, dto: SearchCardsDto): Promise<CardDocument[]> {
        await this.checkBoardPermission(boardId, userId);

        const query: any = {
            boardId: new Types.ObjectId(boardId),
            archived: false,
            $or: [
                { title: { $regex: dto.query, $options: 'i' } },
                { description: { $regex: dto.query, $options: 'i' } },
            ],
        };

        return this.cardModel
            .find(query)
            .sort({ updatedAt: -1 })
            .populate('listId', 'name')
            .populate('assignee', 'name email avatar')
            .populate('labels')
            .exec();
    }

    async filterCards(boardId: string, userId: string, dto: FilterCardsDto): Promise<CardDocument[]> {
        await this.checkBoardPermission(boardId, userId);

        const query: any = {
            boardId: new Types.ObjectId(boardId),
            archived: false,
        };

        if (dto.assigneeIds && dto.assigneeIds.length > 0) {
            query.assignee = { $in: dto.assigneeIds.map((id) => new Types.ObjectId(id)) };
        }

        if (dto.labelIds && dto.labelIds.length > 0) {
            // Logic: ALL labels must be present (Requirement 17.3)
            query.labels = { $all: dto.labelIds.map((id) => new Types.ObjectId(id)) };
        }

        if (dto.priorities && dto.priorities.length > 0) {
            query.priority = { $in: dto.priorities };
        }

        if (dto.dueDateStart || dto.dueDateEnd) {
            const dateQuery: any = {};
            if (dto.dueDateStart) dateQuery.$gte = new Date(dto.dueDateStart);
            if (dto.dueDateEnd) dateQuery.$lte = new Date(dto.dueDateEnd);
            query.dueDate = dateQuery;
        }

        return this.cardModel
            .find(query)
            .sort({ position: 1 })
            .populate('listId', 'name')
            .populate('assignee', 'name email avatar')
            .populate('labels')
            .exec();
    }
}
