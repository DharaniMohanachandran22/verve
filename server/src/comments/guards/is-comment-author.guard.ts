import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentsService } from '../comments.service';
import { BoardsService } from '../../boards/boards.service';
import { Role } from '../../boards/schemas/board.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import { Card, CardDocument } from '../../cards/schemas/card.schema';

@Injectable()
export class IsCommentAuthorGuard implements CanActivate {
    constructor(
        @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
        @InjectModel(Card.name) private readonly cardModel: Model<CardDocument>,
        private readonly boardsService: BoardsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const callerId = req.user?.userId;
        const { commentId } = req.params;

        if (!commentId) return true;

        const comment = await this.commentModel.findById(commentId).exec();
        if (!comment) throw new NotFoundException('Comment not found');

        // Author is always allowed
        if (comment.authorId.toString() === callerId) return true;

        // Board owner is also allowed for deletion, but let's check the method
        const method = req.method;
        if (method === 'DELETE') {
            const card = await this.cardModel.findById(comment.cardId).exec();
            if (card) {
                const board = await this.boardsService.getBoardForPermissionCheck(card.boardId.toString());
                const member = board?.members.find(m => m.userId.toString() === callerId);
                if (member?.role === Role.Owner) {
                    return true;
                }
            }
        }

        throw new ForbiddenException('Only the author can modify this comment');
    }
}
