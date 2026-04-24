import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Label, LabelDocument } from './schemas/label.schema';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { BoardsService } from '../boards/boards.service';
import { Role } from '../boards/schemas/board.schema';
import { Card, CardDocument } from '../cards/schemas/card.schema';

@Injectable()
export class LabelsService {
    constructor(
        @InjectModel(Label.name) private labelModel: Model<LabelDocument>,
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

    async createLabel(boardId: string, userId: string, dto: CreateLabelDto): Promise<any> {
        await this.checkBoardPermission(boardId, userId, [Role.Owner, Role.Editor]);

        const existingLabel = await this.labelModel.findOne({
            boardId: new Types.ObjectId(boardId),
            $or: [
                { name: { $regex: new RegExp(`^${dto.name}$`, 'i') } },
                { color: dto.color }
            ]
        }).exec();

        if (existingLabel) {
            const conflictType = existingLabel.name.toLowerCase() === dto.name.toLowerCase() ? 'name' : 'color';
            throw new ConflictException(`A label with this ${conflictType} already exists on this board`);
        }

        const label = new this.labelModel({
            boardId: new Types.ObjectId(boardId),
            name: dto.name,
            color: dto.color,
        });
        const saved = await label.save();
        return {
            ...saved.toObject(),
            id: saved._id.toString(),
        };
    }

    async findByBoardId(boardId: string, userId: string): Promise<any[]> {
        await this.checkBoardPermission(boardId, userId);

        const labels = await this.labelModel.find({ boardId: new Types.ObjectId(boardId) }).exec();
        return labels.map(l => ({
            ...l.toObject(),
            id: l._id.toString(),
        }));
    }

    async updateLabel(labelId: string, userId: string, dto: UpdateLabelDto): Promise<any> {
        if (!Types.ObjectId.isValid(labelId)) {
            throw new NotFoundException('Label not found');
        }
        const label = await this.labelModel.findById(labelId).exec();
        if (!label) throw new NotFoundException('Label not found');

        // spec says "admin check" (Owner mostly, we can include Editor or just Owner as per Board permissions mapping "Admin Can Edit Labels").
        await this.checkBoardPermission(label.boardId.toString(), userId, [Role.Owner]);

        if ((dto.name !== undefined && dto.name !== label.name) || (dto.color !== undefined && dto.color !== label.color)) {
            const existingLabel = await this.labelModel.findOne({
                boardId: label.boardId,
                $or: [
                    ...(dto.name !== undefined ? [{ name: { $regex: new RegExp(`^${dto.name}$`, 'i') } }] : []),
                    ...(dto.color !== undefined ? [{ color: dto.color }] : [])
                ],
                _id: { $ne: label._id }
            }).exec();

            if (existingLabel) {
                const conflictType = dto.name !== undefined && existingLabel.name.toLowerCase() === dto.name.toLowerCase() ? 'name' : 'color';
                throw new ConflictException(`A label with this ${conflictType} already exists on this board`);
            }
            if (dto.name !== undefined) label.name = dto.name;
            if (dto.color !== undefined) label.color = dto.color;
        }

        const saved = await label.save();
        return {
            ...saved.toObject(),
            id: saved._id.toString(),
        };
    }

    async deleteLabel(labelId: string, userId: string): Promise<void> {
        if (!Types.ObjectId.isValid(labelId)) {
            throw new NotFoundException('Label not found');
        }
        const label = await this.labelModel.findById(labelId).exec();
        if (!label) throw new NotFoundException('Label not found');

        // Admin check
        await this.checkBoardPermission(label.boardId.toString(), userId, [Role.Owner]);

        // Cascade removal from cards
        await this.cardModel.updateMany(
            { labels: new Types.ObjectId(labelId) },
            { $pull: { labels: new Types.ObjectId(labelId) } }
        ).exec();

        await this.labelModel.deleteOne({ _id: labelId }).exec();
    }
}
