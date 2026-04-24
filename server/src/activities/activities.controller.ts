import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ActivitiesService } from './activities.service';
import { AuthGuard } from '../boards/guards/auth.guard';
import { PermissionGuard } from '../boards/guards/permission.guard';
import { Roles } from '../boards/decorators/roles.decorator';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @ApiOperation({ summary: 'Get all activities for a board (Any member)' })
    @ApiResponse({ status: 200, description: 'Board activity feed' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Roles([])
    @Get('boards/:boardId/activities')
    getBoardActivities(@Param('boardId') boardId: string) {
        return this.activitiesService.findByBoardId(boardId);
    }

    @ApiOperation({ summary: 'Get all activities for a card (Any member)' })
    @ApiResponse({ status: 200, description: 'Card activity feed' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Roles([])
    @Get('cards/:cardId/activities')
    getCardActivities(@Param('cardId') cardId: string) {
        return this.activitiesService.findByCardId(cardId);
    }
}
