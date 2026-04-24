import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ReorderListDto } from './dto/reorder-list.dto';
import { AuthGuard } from '../boards/guards/auth.guard';
import { PermissionGuard } from '../boards/guards/permission.guard';
import { Roles } from '../boards/decorators/roles.decorator';
import { Role } from '../boards/schemas/board.schema';

@ApiTags('lists')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class ListsController {
    constructor(private readonly listsService: ListsService) { }

    // ── Owner/Editor only ────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Create a new list on a board' })
    @ApiResponse({ status: 201, description: 'List created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiBody({ type: CreateListDto })
    @UseGuards(PermissionGuard)
    @Roles([Role.Owner, Role.Editor])
    @Post('boards/:boardId/lists')
    createList(
        @Param('boardId') boardId: string,
        @Body() dto: CreateListDto,
        @Req() req: Request,
    ) {
        return this.listsService.createList(boardId, (req as any).user.userId, dto);
    }

    @ApiOperation({ summary: 'Update list details' })
    @ApiResponse({ status: 200, description: 'List updated' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiBody({ type: UpdateListDto })
    @UseGuards(PermissionGuard)
    @Roles([Role.Owner, Role.Editor])
    @Patch('lists/:listId')
    updateList(
        @Param('listId') listId: string,
        @Body() dto: UpdateListDto,
        @Req() req: Request,
    ) {
        return this.listsService.updateList(listId, (req as any).user.userId, dto);
    }

    @ApiOperation({ summary: 'Reorder a list' })
    @ApiResponse({ status: 200, description: 'List reordered' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiBody({ type: ReorderListDto })
    @UseGuards(PermissionGuard)
    @Roles([Role.Owner, Role.Editor])
    @Patch('lists/:listId/position')
    reorderList(
        @Param('listId') listId: string,
        @Body() dto: ReorderListDto,
        @Req() req: Request,
    ) {
        return this.listsService.reorderList(listId, (req as any).user.userId, dto);
    }

    @ApiOperation({ summary: 'Archive a list' })
    @ApiResponse({ status: 200, description: 'List archived' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(PermissionGuard)
    @Roles([Role.Owner, Role.Editor])
    @Delete('lists/:listId/archive')
    archiveList(@Param('listId') listId: string, @Req() req: Request) {
        return this.listsService.archiveList(listId, (req as any).user.userId);
    }

    @ApiOperation({ summary: 'Restore an archived list' })
    @ApiResponse({ status: 200, description: 'List restored' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(PermissionGuard)
    @Roles([Role.Owner, Role.Editor])
    @Post('lists/:listId/restore')
    restoreList(@Param('listId') listId: string, @Req() req: Request) {
        return this.listsService.restoreList(listId, (req as any).user.userId);
    }

    @ApiOperation({ summary: 'Copy a list and its cards' })
    @ApiResponse({ status: 201, description: 'List copied' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(PermissionGuard)
    @Roles([Role.Owner, Role.Editor])
    @Post('lists/:listId/copy')
    copyList(@Param('listId') listId: string, @Body('name') name: string, @Req() req: Request) {
        return this.listsService.copyList(listId, name, (req as any).user.userId);
    }

    @ApiOperation({ summary: 'Move all cards to another list' })
    @ApiResponse({ status: 200, description: 'Cards moved' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(PermissionGuard)
    @Roles([Role.Owner, Role.Editor])
    @Patch('lists/:listId/move-all-cards')
    moveAllCards(
        @Param('listId') listId: string,
        @Body('targetListId') targetListId: string,
        @Req() req: Request,
    ) {
        return this.listsService.moveAllCards(listId, targetListId, (req as any).user.userId);
    }

    @ApiOperation({ summary: 'Sort cards in a list' })
    @ApiResponse({ status: 200, description: 'Cards sorted' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(PermissionGuard)
    @Roles([Role.Owner, Role.Editor])
    @Patch('lists/:listId/sort')
    sortCards(
        @Param('listId') listId: string,
        @Body('sortBy') sortBy: 'newest' | 'oldest' | 'name',
        @Req() req: Request,
    ) {
        return this.listsService.sortCards(listId, sortBy, (req as any).user.userId);
    }

    // ── Owner only ───────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Permanently delete a list' })
    @ApiResponse({ status: 200, description: 'List deleted' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(PermissionGuard)
    @Roles([Role.Owner])
    @Delete('lists/:listId')
    deleteList(@Param('listId') listId: string, @Req() req: Request) {
        return this.listsService.deleteList(listId, (req as any).user.userId);
    }

    // ── Any member ───────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'List all unarchived lists for a board' })
    @ApiResponse({ status: 200, description: 'Returned lists' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(PermissionGuard)
    @Roles([])
    @Get('boards/:boardId/lists')
    getLists(@Param('boardId') boardId: string, @Req() req: Request) {
        return this.listsService.findByBoardId(boardId, (req as any).user.userId);
    }

    @ApiOperation({ summary: 'List archived lists for a board' })
    @ApiResponse({ status: 200, description: 'Archived lists' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(PermissionGuard)
    @Roles([])
    @Get('boards/:boardId/lists/archived')
    getArchivedLists(@Param('boardId') boardId: string, @Req() req: Request) {
        return this.listsService.findArchived(boardId, (req as any).user.userId);
    }

    @ApiOperation({ summary: 'Toggle watch for a list' })
    @ApiResponse({ status: 200, description: 'Watch toggled' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UseGuards(PermissionGuard)
    @Roles([])
    @Patch('lists/:listId/toggle-watch')
    toggleWatch(@Param('listId') listId: string, @Req() req: Request) {
        return this.listsService.toggleWatch(listId, (req as any).user.userId);
    }
}
