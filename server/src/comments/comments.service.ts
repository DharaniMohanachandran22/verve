import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Card, CardDocument } from '../cards/schemas/card.schema';
import { UsersService } from '../users/users.service';
import { BoardsService } from '../boards/boards.service';
import { Role } from '../boards/schemas/board.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class CommentsService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
        @InjectModel(Card.name) private cardModel: Model<CardDocument>,
        private readonly usersService: UsersService,
        private readonly boardsService: BoardsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    private parseMentions(content: string): string[] {
        const mentionRegex = /@(\w+)/g;
        const matches = content.match(mentionRegex);
        if (!matches) return [];
        return matches.map((match) => match.substring(1));
    }

    async createComment(cardId: string, authorId: string, dto: CreateCommentDto): Promise<CommentDocument> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        // Permission check: must be a member of the board
        const board = await this.boardsService.getBoardForPermissionCheck(card.boardId.toString());
        if (!board || !board.members.some(m => m.userId.toString() === authorId)) {
            throw new ForbiddenException('Not a member of the board');
        }

        const usernames = this.parseMentions(dto.content);
        let mentions: Types.ObjectId[] = [];
        if (usernames.length > 0) {
            const mentionIds = await this.usersService.findIdsByUsernames(usernames);
            mentions = mentionIds.map(id => new Types.ObjectId(id));
        }

        const comment = new this.commentModel({
            cardId: new Types.ObjectId(cardId),
            authorId: new Types.ObjectId(authorId),
            content: dto.content,
            mentions,
        });

        const savedComment = await comment.save();

        // Create notifications for mentions
        if (mentions.length > 0) {
            await Promise.all(
                mentions.map((mentionId) =>
                    this.notificationsService.createNotification(
                        mentionId.toString(),
                        NotificationType.MENTION,
                        authorId,
                        'COMMENT',
                        savedComment._id.toString(),
                        { cardId, content: dto.content.substring(0, 100) },
                    ),
                ),
            );
        }

        // Notify watchers
        if (card.watchers && card.watchers.length > 0) {
            await this.notificationsService.notifyMany(
                card.watchers.map(w => w.toString()),
                NotificationType.CARD_UPDATED,
                authorId,
                'CARD',
                card._id.toString(),
                { title: card.title, action: 'commented', commentSnippet: dto.content.substring(0, 50) },
            );
        }

        return savedComment;
    }

    async findByCardId(cardId: string, userId: string): Promise<any[]> {
        const card = await this.cardModel.findById(cardId).exec();
        if (!card) throw new NotFoundException('Card not found');

        const board = await this.boardsService.getBoardForPermissionCheck(card.boardId.toString());
        if (!board || !board.members.some(m => m.userId.toString() === userId)) {
            throw new ForbiddenException('Not a member of the board');
        }

        const comments = await this.commentModel
            .find({ cardId: new Types.ObjectId(cardId) })
            .sort({ createdAt: 1 })
            .populate('authorId', 'name email')
            .lean()
            .exec();

        return comments.map((c) => ({
            ...c,
            id: (c._id as Types.ObjectId).toString(),
            authorId: (c.authorId as any)?._id?.toString() ?? c.authorId.toString(),
            authorName: (c.authorId as any)?.name ?? null,
            authorEmail: (c.authorId as any)?.email ?? null,
        }));
    }

    async updateComment(commentId: string, userId: string, dto: UpdateCommentDto): Promise<CommentDocument> {
        const comment = await this.commentModel.findById(commentId).exec();
        if (!comment) throw new NotFoundException('Comment not found');

        if (comment.authorId.toString() !== userId) {
            throw new ForbiddenException('Only the author can update the comment');
        }

        const usernames = this.parseMentions(dto.content);
        let mentions: Types.ObjectId[] = [];
        if (usernames.length > 0) {
            const mentionIds = await this.usersService.findIdsByUsernames(usernames);
            mentions = mentionIds.map(id => new Types.ObjectId(id));
        }

        comment.content = dto.content;
        comment.mentions = mentions;
        return comment.save();
    }

    async deleteComment(commentId: string, userId: string): Promise<void> {
        const comment = await this.commentModel.findById(commentId).exec();
        if (!comment) throw new NotFoundException('Comment not found');

        if (comment.authorId.toString() === userId) {
            await this.commentModel.deleteOne({ _id: commentId }).exec();
            return;
        }

        // Check if user is board owner
        const card = await this.cardModel.findById(comment.cardId).exec();
        if (card) {
            const board = await this.boardsService.getBoardForPermissionCheck(card.boardId.toString());
            const member = board?.members.find(m => m.userId.toString() === userId);
            if (member?.role === Role.Owner) {
                await this.commentModel.deleteOne({ _id: commentId }).exec();
                return;
            }
        }

        throw new ForbiddenException('Permission denied');
    }
}
