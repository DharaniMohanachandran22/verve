import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment, AttachmentDocument } from './schemas/attachment.schema';
import { Card, CardDocument } from '../cards/schemas/card.schema';
import { BoardsService } from '../boards/boards.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import * as fs from 'fs';
import * as path from 'path';

export interface FileMetadata {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
}

@Injectable()
export class AttachmentsService {
    constructor(
        @InjectModel(Attachment.name) private attachmentModel: Model<AttachmentDocument>,
        @InjectModel(Card.name) private cardModel: Model<CardDocument>,
        private readonly boardsService: BoardsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async createAttachment(cardId: string, userId: string, file: FileMetadata): Promise<AttachmentDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        const board = await this.boardsService.getBoardForPermissionCheck(card.boardId.toString());
        if (!board || !board.members.some(m => m.userId.toString() === userId)) {
            throw new ForbiddenException('Not a member of the board');
        }

        const attachment = new this.attachmentModel({
            cardId: new Types.ObjectId(cardId),
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
            uploadedBy: new Types.ObjectId(userId),
        });

        const saved = await attachment.save();

        // Notify watchers
        if (card.watchers && card.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                card.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                userId,
                'CARD',
                card._id.toString(),
                { title: card.title, action: 'added an attachment', attachmentName: file.originalname },
            );
        }

        return saved;
    }

    async findByCardId(cardId: string, userId: string): Promise<AttachmentDocument[]> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        const board = await this.boardsService.getBoardForPermissionCheck(card.boardId.toString());
        if (!board || !board.members.some(m => m.userId.toString() === userId)) {
            throw new ForbiddenException('Not a member of the board');
        }

        return this.attachmentModel.find({ cardId: new Types.ObjectId(cardId) }).exec();
    }

    async findById(attachmentId: string, userId: string): Promise<AttachmentDocument> {
        const attachment = await this.attachmentModel.findById(attachmentId).exec();
        if (!attachment) throw new NotFoundException('Attachment not found');

        const card = await this.cardModel.findById(attachment.cardId).exec();
        if (card) {
            const board = await this.boardsService.getBoardForPermissionCheck(card.boardId.toString());
            if (!board || !board.members.some(m => m.userId.toString() === userId)) {
                throw new ForbiddenException('Not a member of the board');
            }
        }

        return attachment;
    }

    async updateAttachment(attachmentId: string, userId: string, originalName: string): Promise<AttachmentDocument> {
        const attachment = await this.attachmentModel.findById(attachmentId).exec();
        if (!attachment) throw new NotFoundException('Attachment not found');

        const card = await this.cardModel.findById(attachment.cardId).exec();
        if (card) {
            const board = await this.boardsService.getBoardForPermissionCheck(card.boardId.toString());
            if (!board || !board.members.some(m => m.userId.toString() === userId)) {
                throw new ForbiddenException('Not a member of the board');
            }
        }

        attachment.originalName = originalName;
        return attachment.save();
    }

    async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
        const attachment = await this.attachmentModel.findById(attachmentId).exec();
        if (!attachment) throw new NotFoundException('Attachment not found');

        const card = await this.cardModel.findById(attachment.cardId).exec();
        if (card) {
            const board = await this.boardsService.getBoardForPermissionCheck(card.boardId.toString());
            if (!board || !board.members.some(m => m.userId.toString() === userId)) {
                throw new ForbiddenException('Not a member of the board');
            }
        }

        // Author or owner check could be added, but for now member is enough as per general member requirements.

        // Delete file from filesystem
        const filePath = path.join(process.cwd(), attachment.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await this.attachmentModel.deleteOne({ _id: attachmentId }).exec();
    }
}
