import { Body, Controller, Delete, Param, Patch, Post, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { AddChecklistItemDto } from './dto/add-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { AuthGuard } from '../boards/guards/auth.guard';

@ApiTags('checklists')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class ChecklistsController {
    constructor(private readonly checklistsService: ChecklistsService) { }

    @ApiOperation({ summary: 'Create a new checklist on a card' })
    @ApiBody({ type: CreateChecklistDto })
    @ApiResponse({ status: 201, description: 'Checklist created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Post('cards/:cardId/checklists')
    createChecklist(
        @Param('cardId') cardId: string,
        @Body() dto: CreateChecklistDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.checklistsService.createChecklist(cardId, userId, dto);
    }

    @ApiOperation({ summary: 'Add an item to a checklist' })
    @ApiBody({ type: AddChecklistItemDto })
    @ApiResponse({ status: 201, description: 'Item added' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Post('checklists/:checklistId/items')
    addItem(
        @Param('checklistId') checklistId: string,
        @Body() dto: AddChecklistItemDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.checklistsService.addItem(checklistId, userId, dto);
    }

    @ApiOperation({ summary: 'Update a checklist item (text or completion)' })
    @ApiBody({ type: UpdateChecklistItemDto })
    @ApiResponse({ status: 200, description: 'Item updated' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Patch('checklists/:checklistId/items/:itemId')
    updateItem(
        @Param('checklistId') checklistId: string,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateChecklistItemDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.checklistsService.updateItem(checklistId, itemId, userId, dto);
    }

    @ApiOperation({ summary: 'Delete a checklist item' })
    @ApiResponse({ status: 200, description: 'Item deleted' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Delete('checklists/:checklistId/items/:itemId')
    deleteItem(
        @Param('checklistId') checklistId: string,
        @Param('itemId') itemId: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.checklistsService.deleteItem(checklistId, itemId, userId);
    }

    @ApiOperation({ summary: 'Delete an entire checklist' })
    @ApiResponse({ status: 204, description: 'Checklist deleted' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Delete('checklists/:checklistId')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteChecklist(@Param('checklistId') checklistId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.checklistsService.deleteChecklist(checklistId, userId);
    }
}
