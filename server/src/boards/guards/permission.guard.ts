import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BoardsService } from '../boards.service';
import { ROLES_KEY, PermissionGuardMeta } from '../decorators/roles.decorator';
import { Role } from '../schemas/board.schema';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly boardsService: BoardsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<PermissionGuardMeta>(ROLES_KEY, context.getHandler());
    const req = context.switchToHttp().getRequest();
    const { boardId, userId: paramUserId } = req.params;
    const callerId: string = req.user?.userId;

    // If no boardId in params, permission is enforced at the service level
    if (!boardId) return true;

    const board = await this.boardsService.getBoardForPermissionCheck(boardId);
    if (!board) throw new ForbiddenException();

    const member = board.members.find((m) => m.userId.toString() === callerId);
    if (!member) throw new ForbiddenException();

    // allowSelf: let a member act on their own userId param
    if (meta?.allowSelf && paramUserId && paramUserId === callerId) {
      return true;
    }

    // Empty roles array = any member is allowed
    if (!meta || meta.roles.length === 0) return true;

    if (meta.roles.includes(member.role as Role)) return true;

    throw new ForbiddenException();
  }
}
