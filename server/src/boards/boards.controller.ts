import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { Roles } from './decorators/roles.decorator';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Role } from './schemas/board.schema';
import { LogActivity } from '../activities/decorators/activity.decorator';
import { ActionType, EntityType } from '../activities/schemas/activity.schema';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('boards')
@ApiBearerAuth()
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) { }

  @ApiOperation({ summary: 'Create a new board' })
  @ApiBody({ type: CreateBoardDto })
  @ApiResponse({ status: 201, description: 'Board created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @LogActivity(ActionType.CREATE, EntityType.BOARD)
  @Post()
  createBoard(@Req() req: Request, @Body() dto: CreateBoardDto) {
    const userId = (req as any).user.userId;
    return this.boardsService.createBoard(userId, dto);
  }

  @ApiOperation({ summary: 'List all boards the caller is a member of' })
  @ApiResponse({ status: 200, description: 'List of boards' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Get()
  listBoards(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.boardsService.listBoards(userId);
  }

  @ApiOperation({ summary: 'Get board details including members' })
  @ApiResponse({ status: 200, description: 'Board detail' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([])
  @Get(':boardId')
  getBoard(@Param('boardId') boardId: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.boardsService.getBoard(boardId, userId);
  }

  @ApiOperation({ summary: 'Update board details (owner only)' })
  @ApiBody({ type: UpdateBoardDto })
  @ApiResponse({ status: 200, description: 'Board updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @LogActivity(ActionType.UPDATE, EntityType.BOARD)
  @Patch(':boardId')
  updateBoard(
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.updateBoard(boardId, dto);
  }

  @ApiOperation({ summary: 'Archive a board (owner only)' })
  @ApiResponse({ status: 200, description: 'Board archived' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @LogActivity(ActionType.ARCHIVE, EntityType.BOARD)
  @Delete(':boardId/archive')
  archiveBoard(@Param('boardId') boardId: string) {
    return this.boardsService.archiveBoard(boardId);
  }

  @ApiOperation({ summary: 'Restore an archived board (owner only)' })
  @ApiResponse({ status: 200, description: 'Board restored' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @LogActivity(ActionType.RESTORE, EntityType.BOARD)
  @Post(':boardId/restore')
  restoreBoard(@Param('boardId') boardId: string) {
    return this.boardsService.restoreBoard(boardId);
  }

  @ApiOperation({ summary: 'Delete a board (owner only)' })
  @ApiResponse({ status: 204, description: 'Board deleted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @Delete(':boardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBoard(@Param('boardId') boardId: string) {
    return this.boardsService.deleteBoard(boardId);
  }

  @ApiOperation({ summary: 'List members of a board' })
  @ApiResponse({ status: 200, description: 'List of members' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([])
  @Get(':boardId/members')
  listMembers(@Param('boardId') boardId: string) {
    return this.boardsService.listMembers(boardId);
  }

  @ApiOperation({ summary: 'Invite a user to the board by email (owner only)' })
  @ApiBody({ type: InviteMemberDto })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @Post(':boardId/members')
  async inviteMember(
    @Param('boardId') boardId: string,
    @Body() dto: InviteMemberDto,
    @Req() req: Request,
  ) {
    const callerId = (req as any).user.userId;
    return this.boardsService.inviteMember(boardId, dto, dto.email, callerId);
  }

  @Public()
  @ApiOperation({ summary: 'Preview an invitation (public — returns invited email and board name)' })
  @ApiResponse({ status: 200, description: 'Invitation preview' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Invitation not found or expired' })
  @Get('invitations/:token/preview')
  getInvitationPreview(@Param('token') token: string) {
    return this.boardsService.getInvitationPreview(token);
  }

  @ApiOperation({ summary: 'Accept a board invitation via token' })
  @ApiResponse({ status: 200, description: 'Joined board' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invitation not found or expired' })
  @UseGuards(AuthGuard)
  @Post('invitations/:token/accept')
  acceptInvitation(@Param('token') token: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.boardsService.acceptInvitation(token, userId);
  }

  @ApiOperation({ summary: 'List pending invitations for a board (owner only)' })
  @ApiResponse({ status: 200, description: 'Pending invites' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @Get(':boardId/invitations')
  listPendingInvites(@Param('boardId') boardId: string) {
    return this.boardsService.listPendingInvites(boardId);
  }

  @ApiOperation({ summary: 'Cancel a pending invitation (owner only)' })
  @ApiResponse({ status: 204, description: 'Invitation cancelled' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':boardId/invitations/:token')
  cancelInvitation(@Param('boardId') boardId: string, @Param('token') token: string) {
    return this.boardsService.cancelInvitation(boardId, token);
  }

  @ApiOperation({ summary: "Update a member's role (owner only)" })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @LogActivity(ActionType.UPDATE, EntityType.MEMBER)
  @Patch(':boardId/members/:userId')
  updateMemberRole(
    @Param('boardId') boardId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: Request,
  ) {
    const callerId = (req as any).user.userId;
    return this.boardsService.updateMemberRole(boardId, targetUserId, dto, callerId);
  }

  @ApiOperation({ summary: 'Remove a member from the board (owner or self)' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner], true)
  @LogActivity(ActionType.REMOVE_MEMBER, EntityType.MEMBER)
  @Delete(':boardId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('boardId') boardId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const callerId = (req as any).user.userId;
    return this.boardsService.removeMember(boardId, targetUserId, callerId);
  }

  // ── Share link ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get share link info for a board' })
  @ApiResponse({ status: 200, description: 'Share info' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @Get(':boardId/share')
  getShareInfo(@Param('boardId') boardId: string) {
    return this.boardsService.getShareInfo(boardId);
  }

  @ApiOperation({ summary: 'Generate or refresh share link (owner only)' })
  @ApiBody({ schema: { properties: { role: { type: 'string', enum: Object.values(Role), example: Role.Viewer } } } })
  @ApiResponse({ status: 201, description: 'Share link generated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @Post(':boardId/share')
  generateShareLink(
    @Param('boardId') boardId: string,
    @Body('role') role: Role = Role.Viewer,
  ) {
    return this.boardsService.generateShareLink(boardId, role);
  }

  @ApiOperation({ summary: 'Delete share link (owner only)' })
  @ApiResponse({ status: 204, description: 'Share link deleted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(AuthGuard, PermissionGuard)
  @Roles([Role.Owner])
  @Delete(':boardId/share')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteShareLink(@Param('boardId') boardId: string) {
    return this.boardsService.deleteShareLink(boardId);
  }

  @Public()
  @ApiOperation({ summary: 'Preview board info from share token (public)' })
  @ApiResponse({ status: 200, description: 'Board preview' })
  @Get('join/:token/preview')
  getBoardPreview(@Param('token') token: string) {
    return this.boardsService.getBoardPreviewByToken(token);
  }

  @ApiOperation({ summary: 'Join a board via share token' })
  @ApiResponse({ status: 200, description: 'Joined board' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invalid or expired share token' })
  @UseGuards(AuthGuard)
  @Post('join/:token')
  joinViaShareLink(@Param('token') token: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.boardsService.joinViaShareLink(token, userId);
  }
}
