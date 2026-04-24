import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../boards/guards/auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @ApiOperation({ summary: 'List latest notifications for user' })
    @ApiResponse({ status: 200, description: 'Notification feed' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get()
    getNotifications(@Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.notificationsService.findForUser(userId);
    }

    @ApiOperation({ summary: 'Get unread count' })
    @ApiResponse({ status: 200, description: 'Number of unread notifications' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('unread-count')
    getUnreadCount(@Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.notificationsService.getUnreadCount(userId);
    }

    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 200, description: 'Success' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Patch(':id/read')
    markAsRead(@Param('id') notificationId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.notificationsService.markAsRead(notificationId, userId);
    }

    @ApiOperation({ summary: 'Mark all as read' })
    @ApiResponse({ status: 200, description: 'Success' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Patch('read-all')
    markAllAsRead(@Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.notificationsService.markAllAsRead(userId);
    }
}
