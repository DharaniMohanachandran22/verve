import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SearchService } from './search.service';
import { SearchCardsDto, FilterCardsDto } from './dto/search-filter.dto';
import { AuthGuard } from '../boards/guards/auth.guard';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('boards/:boardId')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @ApiOperation({ summary: 'Search for cards in a board' })
    @ApiResponse({ status: 200, description: 'Matched cards' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('search')
    searchCards(
        @Param('boardId') boardId: string,
        @Query() dto: SearchCardsDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.searchService.searchCards(boardId, userId, dto);
    }

    @ApiOperation({ summary: 'Filter cards in a board with multiple criteria' })
    @ApiBody({ type: FilterCardsDto })
    @ApiResponse({ status: 200, description: 'Filtered cards' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Post('filter')
    filterCards(
        @Param('boardId') boardId: string,
        @Body() dto: FilterCardsDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user.userId;
        return this.searchService.filterCards(boardId, userId, dto);
    }
}
