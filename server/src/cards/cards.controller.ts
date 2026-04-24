import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { AddLabelDto } from './dto/add-label.dto';
import { AuthGuard } from '../boards/guards/auth.guard';
import { LogActivity } from '../activities/decorators/activity.decorator';
import { ActionType, EntityType } from '../activities/schemas/activity.schema';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class CardsController {
    constructor(private readonly cardsService: CardsService) { }

    @ApiOperation({ summary: 'Create a new card in a list' })
    @ApiBody({ type: CreateCardDto })
    @ApiResponse({ status: 201, description: 'Card created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @LogActivity(ActionType.CREATE, EntityType.CARD)
    @Post('lists/:listId/cards')
    createCard(
        @Param('listId') listId: string,
        @Body() dto: CreateCardDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.cardsService.createCard(listId, userId, dto);
    }

    @ApiOperation({ summary: 'List all unarchived cards for a list' })
    @ApiResponse({ status: 200, description: 'Returned cards' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('lists/:listId/cards')
    getCardsByList(@Param('listId') listId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.cardsService.findByListId(listId, userId);
    }

    @ApiOperation({ summary: 'Get a specific card' })
    @ApiResponse({ status: 200, description: 'Card details' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('cards/:cardId')
    getCard(@Param('cardId') cardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.cardsService.findById(cardId, userId);
    }

    @ApiOperation({ summary: 'Search cards in a board' })
    @ApiResponse({ status: 200, description: 'Matching cards' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('boards/:boardId/cards/search')
    searchCards(
        @Param('boardId') boardId: string,
        @Req() req: Request,
    ) {
        const q = (req.query as any).q || '';
        const userId = (req as any).user.userId;
        return this.cardsService.searchInBoard(boardId, userId, q);
    }

    @ApiOperation({ summary: 'List archived cards for a board' })
    @ApiResponse({ status: 200, description: 'Archived cards' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('boards/:boardId/cards/archived')
    getArchivedCards(@Param('boardId') boardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.cardsService.findArchived(boardId, userId);
    }

    @ApiOperation({ summary: 'Update card details' })
    @ApiBody({ type: UpdateCardDto })
    @ApiResponse({ status: 200, description: 'Card updated' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @LogActivity(ActionType.UPDATE, EntityType.CARD)
    @Patch('cards/:cardId')
    updateCard(
        @Param('cardId') cardId: string,
        @Body() dto: UpdateCardDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.cardsService.updateCard(cardId, userId, dto);
    }

    @ApiOperation({ summary: 'Move card to another list or position' })
    @ApiBody({ type: MoveCardDto })
    @ApiResponse({ status: 200, description: 'Card moved' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @LogActivity(ActionType.MOVE, EntityType.CARD)
    @Patch('cards/:cardId/move')
    moveCard(
        @Param('cardId') cardId: string,
        @Body() dto: MoveCardDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.cardsService.moveCard(cardId, userId, dto);
    }

    @ApiOperation({ summary: 'Archive a card' })
    @ApiResponse({ status: 200, description: 'Card archived' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @LogActivity(ActionType.ARCHIVE, EntityType.CARD)
    @Delete('cards/:cardId/archive')
    archiveCard(@Param('cardId') cardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.cardsService.archiveCard(cardId, userId);
    }

    @ApiOperation({ summary: 'Restore an archived card' })
    @ApiResponse({ status: 200, description: 'Card restored' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @LogActivity(ActionType.RESTORE, EntityType.CARD)
    @Post('cards/:cardId/restore')
    restoreCard(@Param('cardId') cardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.cardsService.restoreCard(cardId, userId);
    }

    @ApiOperation({ summary: 'Copy a card' })
    @ApiResponse({ status: 201, description: 'Card copied' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @LogActivity(ActionType.CREATE, EntityType.CARD)
    @Post('cards/:cardId/copy')
    copyCard(
        @Param('cardId') cardId: string,
        @Body('title') title: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.cardsService.copyCard(cardId, userId, title);
    }

    @ApiOperation({ summary: 'Toggle watch for a card' })
    @ApiResponse({ status: 200, description: 'Watch toggled' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Patch('cards/:cardId/toggle-watch')
    toggleWatch(@Param('cardId') cardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.cardsService.toggleWatcher(cardId, userId);
    }

    @ApiOperation({ summary: 'Add a watcher (self-watch)' })
    @ApiResponse({ status: 201, description: 'Watcher added' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Post('cards/:cardId/watchers')
    addWatcher(@Param('cardId') cardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.cardsService.addWatcher(cardId, userId);
    }

    @ApiOperation({ summary: 'Remove a watcher (self-remove)' })
    @ApiResponse({ status: 200, description: 'Watcher removed' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Delete('cards/:cardId/watchers')
    removeWatcher(@Param('cardId') cardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.cardsService.removeWatcher(cardId, userId);
    }

    @ApiOperation({ summary: 'Add a label to a card' })
    @ApiBody({ type: AddLabelDto })
    @ApiResponse({ status: 201, description: 'Label added' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Post('cards/:cardId/labels')
    addLabel(
        @Param('cardId') cardId: string,
        @Body() dto: AddLabelDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.cardsService.addLabel(cardId, userId, dto.labelId);
    }

    @ApiOperation({ summary: 'Remove a label from a card' })
    @ApiResponse({ status: 200, description: 'Label removed' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Delete('cards/:cardId/labels/:labelId')
    removeLabel(
        @Param('cardId') cardId: string,
        @Param('labelId') labelId: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.cardsService.removeLabel(cardId, userId, labelId);
    }

    @ApiOperation({ summary: 'Permanently delete a card' })
    @ApiResponse({ status: 200, description: 'Card deleted' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @LogActivity(ActionType.DELETE, EntityType.CARD)
    @Delete('cards/:cardId')
    deleteCard(@Param('cardId') cardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.cardsService.deleteCard(cardId, userId);
    }
}
