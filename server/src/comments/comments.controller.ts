import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthGuard } from '../boards/guards/auth.guard';
import { IsCommentAuthorGuard } from './guards/is-comment-author.guard';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @ApiOperation({ summary: 'Add a comment to a card' })
    @ApiBody({ type: CreateCommentDto })
    @ApiResponse({ status: 201, description: 'Comment added' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Post('cards/:cardId/comments')
    createComment(
        @Param('cardId') cardId: string,
        @Body() dto: CreateCommentDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.commentsService.createComment(cardId, userId, dto);
    }

    @ApiOperation({ summary: 'List all comments for a card' })
    @ApiResponse({ status: 200, description: 'Returned comments' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('cards/:cardId/comments')
    getComments(@Param('cardId') cardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.commentsService.findByCardId(cardId, userId);
    }

    @ApiOperation({ summary: 'Update a comment' })
    @ApiBody({ type: UpdateCommentDto })
    @ApiResponse({ status: 200, description: 'Comment updated' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(IsCommentAuthorGuard)
    @Patch('comments/:commentId')
    updateComment(
        @Param('commentId') commentId: string,
        @Body() dto: UpdateCommentDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.commentsService.updateComment(commentId, userId, dto);
    }

    @ApiOperation({ summary: 'Delete a comment' })
    @ApiResponse({ status: 204, description: 'Comment deleted' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(IsCommentAuthorGuard)
    @Delete('comments/:commentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteComment(@Param('commentId') commentId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.commentsService.deleteComment(commentId, userId);
    }
}
