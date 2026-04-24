import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AuthGuard } from '../boards/guards/auth.guard';

@ApiTags('labels')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class LabelsController {
    constructor(private readonly labelsService: LabelsService) { }

    @ApiOperation({ summary: 'Create a new label on a board' })
    @ApiBody({ type: CreateLabelDto })
    @ApiResponse({ status: 201, description: 'Label created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Post('boards/:boardId/labels')
    createLabel(
        @Param('boardId') boardId: string,
        @Body() dto: CreateLabelDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.labelsService.createLabel(boardId, userId, dto);
    }

    @ApiOperation({ summary: 'List all labels for a board' })
    @ApiResponse({ status: 200, description: 'Returned labels' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('boards/:boardId/labels')
    getLabels(@Param('boardId') boardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.labelsService.findByBoardId(boardId, userId);
    }

    @ApiOperation({ summary: 'Update label details (Admin only)' })
    @ApiBody({ type: UpdateLabelDto })
    @ApiResponse({ status: 200, description: 'Label updated' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Patch('labels/:labelId')
    updateLabel(
        @Param('labelId') labelId: string,
        @Body() dto: UpdateLabelDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.labelsService.updateLabel(labelId, userId, dto);
    }

    @ApiOperation({ summary: 'Delete a label (Admin only)' })
    @ApiResponse({ status: 204, description: 'Label deleted' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Delete('labels/:labelId')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteLabel(@Param('labelId') labelId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.labelsService.deleteLabel(labelId, userId);
    }
}
