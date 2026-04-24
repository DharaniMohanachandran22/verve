import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { Board, BoardDocument, Role } from './schemas/board.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { List, ListDocument } from '../lists/schemas/list.schema';
import { Card, CardDocument, Priority } from '../cards/schemas/card.schema';
import { Label, LabelDocument } from '../labels/schemas/label.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { UsersService } from '../users/users.service';
import { MailerService } from '../common/mailer/mailer.service';

export interface BoardSummary {
  id: string;
  name: string;
  role: Role;
}

export interface BoardDetail {
  id: string;
  name: string;
  description: string;
  members: MemberResponse[];
  lists: {
    id: string;
    name: string;
    position: number;
    cards: {
      id: string;
      title: string;
      position: number;
      priority?: Priority;
      dueDate?: Date;
      labels: string[];
      assignee?: string;
    }[];
  }[];
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
}

export interface MemberResponse {
  userId: string;
  role: Role;
  name?: string;
  email?: string;
}

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    @InjectModel(List.name) private listModel: Model<ListDocument>,
    @InjectModel(Card.name) private cardModel: Model<CardDocument>,
    @InjectModel(Label.name) private labelModel: Model<LabelDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
  ) { }

  async createBoard(userId: string, dto: CreateBoardDto): Promise<BoardDocument> {
    const board = new this.boardModel({
      name: dto.name,
      description: dto.description || '',
      createdBy: new Types.ObjectId(userId),
      members: [{ userId: new Types.ObjectId(userId), role: Role.Owner }],
    });
    const savedBoard = await board.save();

    // Create default lists
    const defaultLists = ['To-Do', 'In Progress', 'Completed'];
    await Promise.all(
      defaultLists.map((name, index) =>
        this.listModel.create({
          boardId: savedBoard._id,
          name,
          position: index * 1024,
        }),
      ),
    );

    return savedBoard;
  }

  async listBoards(userId: string): Promise<BoardSummary[]> {
    const boards = await this.boardModel
      .find({ 'members.userId': new Types.ObjectId(userId) })
      .lean()
      .exec();

    return boards.map((b) => {
      const member = b.members.find((m) => m.userId.toString() === userId);
      return { id: (b._id as Types.ObjectId).toString(), name: b.name, role: member!.role };
    });
  }

  async getBoard(boardId: string, userId: string): Promise<BoardDetail> {
    const board = await this.boardModel.findById(boardId).populate('members.userId', 'name email').lean().exec();
    if (!board) throw new NotFoundException('Board not found');

    const [lists, cards, labels] = await Promise.all([
      this.listModel.find({ boardId: new Types.ObjectId(boardId), archived: false }).sort({ position: 1 }).lean().exec(),
      this.cardModel.find({ boardId: new Types.ObjectId(boardId), archived: false }).sort({ position: 1 }).lean().exec(),
      this.labelModel.find({ boardId: new Types.ObjectId(boardId) }).lean().exec(),
    ]);

    const formattedLists = lists.map((list) => ({
      id: (list._id as Types.ObjectId).toString(),
      name: list.name,
      position: list.position,
      cards: cards
        .filter((card) => card.listId.toString() === list._id.toString())
        .map((card) => ({
          id: (card._id as Types.ObjectId).toString(),
          title: card.title,
          position: card.position,
          priority: card.priority,
          dueDate: card.dueDate,
          labels: card.labels.map((l) => l.toString()),
          assignee: card.assignee?.toString(),
          watchers: (card.watchers || []).map((w) => w.toString()),
        })),
    }));

    return {
      id: (board._id as Types.ObjectId).toString(),
      name: board.name,
      description: board.description || '',
      members: board.members
        .filter((m: any) => m.userId != null)
        .map((m: any) => ({
          userId: m.userId._id.toString(),
          role: m.role,
          name: m.userId.name,
          email: m.userId.email,
        })),
      lists: formattedLists,
      labels: labels.map((l) => ({
        id: (l._id as Types.ObjectId).toString(),
        name: l.name,
        color: l.color,
      })),
    };
  }

  async updateBoard(boardId: string, dto: UpdateBoardDto): Promise<BoardDocument> {
    const board = await this.boardModel.findByIdAndUpdate(boardId, dto, { new: true }).exec();
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async archiveBoard(boardId: string): Promise<BoardDocument> {
    const board = await this.boardModel.findByIdAndUpdate(boardId, { archived: true }, { new: true }).exec();
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async restoreBoard(boardId: string): Promise<BoardDocument> {
    const board = await this.boardModel.findByIdAndUpdate(boardId, { archived: false }, { new: true }).exec();
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async deleteBoard(boardId: string): Promise<void> {
    await this.boardModel.deleteOne({ _id: boardId }).exec();
    // Cascading delete for lists and cards is handled here when those models exist
  }

  async listMembers(boardId: string): Promise<MemberResponse[]> {
    const board = await this.boardModel.findById(boardId).populate('members.userId', 'name email').lean().exec();
    if (!board) throw new NotFoundException('Board not found');
    return board.members
      .filter((m: any) => m.userId != null)
      .map((m: any) => ({
        userId: m.userId._id.toString(),
        role: m.role,
        name: m.userId.name,
        email: m.userId.email,
      }));
  }

  async inviteMember(
    boardId: string,
    dto: InviteMemberDto,
    _invitedEmail: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) throw new NotFoundException('Board not found');

    const actor = await this.usersService.findById(actorId);
    if (!actor) throw new NotFoundException('Actor not found');

    // Check if already a member
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      const alreadyMember = board.members.some(m => m.userId.toString() === existingUser._id.toString());
      if (alreadyMember) throw new ConflictException('User is already a member of this board');
    }

    // Check if already has a pending invite
    const alreadyPending = board.pendingInvites.some(i => i.email === dto.email);
    if (alreadyPending) throw new ConflictException('An invitation has already been sent to this email');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    board.pendingInvites.push({ email: dto.email, role: dto.role, token, expiresAt });
    await board.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const acceptUrl = `${clientUrl}/boards/join/invite/${token}`;
    await this.mailerService.sendBoardInvitation(dto.email, actor.name, board.name, acceptUrl);

    return { message: 'Invitation sent successfully' };
  }

  async getInvitationPreview(token: string): Promise<{ invitedEmail: string; boardName: string }> {
    const board = await this.boardModel.findOne({ 'pendingInvites.token': token }).exec();
    if (!board) throw new NotFoundException('Invite link expired or invalid');
    const invite = board.pendingInvites.find(i => i.token === token);
    if (!invite) throw new NotFoundException('Invite link expired or invalid');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite link expired or invalid');
    return { invitedEmail: invite.email, boardName: board.name };
  }

  async acceptInvitation(token: string, userId: string): Promise<{ boardId: string; role: Role }> {
    // Check cancelled tokens across all boards
    const cancelledBoard = await this.boardModel.findOne({ cancelledInviteTokens: token }).exec();
    if (cancelledBoard) throw new NotFoundException('This invitation was cancelled by the owner');

    // Check already-used tokens across all boards
    const usedBoard = await this.boardModel.findOne({ usedInviteTokens: token }).exec();
    if (usedBoard) throw new BadRequestException('This invite link has already been used');

    const board = await this.boardModel.findOne({ 'pendingInvites.token': token }).exec();
    if (!board) throw new NotFoundException('Invite link expired or invalid');

    const invite = board.pendingInvites.find(i => i.token === token);
    if (!invite) throw new NotFoundException('Invite link expired or invalid');

    if (invite.expiresAt < new Date()) {
      board.pendingInvites = board.pendingInvites.filter(i => i.token !== token) as typeof board.pendingInvites;
      await board.save();
      throw new BadRequestException('Invite link expired or invalid');
    }

    // Enforce email binding — the accepting user must match the invited email
    const acceptingUser = await this.usersService.findById(userId);
    if (!acceptingUser) throw new NotFoundException('User not found');
    if (acceptingUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new BadRequestException(
        `This invitation is restricted to ${invite.email}. Please use the same email to continue.`
      );
    }

    const alreadyMember = board.members.some(m => m.userId.toString() === userId);
    if (!alreadyMember) {
      board.members.push({ userId: new Types.ObjectId(userId), role: invite.role });
    }

    board.pendingInvites = board.pendingInvites.filter(i => i.token !== token) as typeof board.pendingInvites;
    if (!board.usedInviteTokens) board.usedInviteTokens = [];
    board.usedInviteTokens.push(token);
    await board.save();

    return { boardId: (board._id as Types.ObjectId).toString(), role: invite.role };
  }

  async listPendingInvites(boardId: string): Promise<{ email: string; role: Role; token: string; expiresAt: Date }[]> {
    const board = await this.boardModel.findById(boardId).lean().exec();
    if (!board) throw new NotFoundException('Board not found');
    return (board.pendingInvites || [])
      .filter(i => i.expiresAt > new Date())
      .map(i => ({ email: i.email, role: i.role, token: i.token, expiresAt: i.expiresAt }));
  }

  async cancelInvitation(boardId: string, token: string): Promise<void> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) throw new NotFoundException('Board not found');
    board.pendingInvites = board.pendingInvites.filter(i => i.token !== token) as typeof board.pendingInvites;
    if (!board.cancelledInviteTokens) board.cancelledInviteTokens = [];
    board.cancelledInviteTokens.push(token);
    await board.save();
  }

  async updateMemberRole(
    boardId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
    callerId: string,
  ): Promise<MemberResponse> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) throw new NotFoundException('Board not found');

    const target = board.members.find((m) => m.userId.toString() === targetUserId);
    if (!target) throw new NotFoundException('Member not found');

    const ownerCount = board.members.filter((m) => m.role === Role.Owner).length;

    // Prevent demoting the sole owner
    if (target.role === Role.Owner && dto.role !== Role.Owner && ownerCount === 1) {
      throw new BadRequestException('Board must have at least one owner');
    }

    // If caller is demoting themselves, require newOwnerId
    if (callerId === targetUserId && dto.role !== Role.Owner) {
      if (!dto.newOwnerId) {
        throw new BadRequestException('Board must have at least one owner');
      }
      const newOwner = board.members.find((m) => m.userId.toString() === dto.newOwnerId);
      if (!newOwner) throw new NotFoundException('New owner not found');
      newOwner.role = Role.Owner;
    }

    target.role = dto.role;
    await board.save();

    return { userId: targetUserId, role: dto.role };
  }

  async removeMember(boardId: string, targetUserId: string, callerId: string): Promise<void> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) throw new NotFoundException('Board not found');

    const target = board.members.find((m) => m.userId.toString() === targetUserId);
    if (!target) throw new NotFoundException('Member not found');

    const ownerCount = board.members.filter((m) => m.role === Role.Owner).length;
    if (target.role === Role.Owner && ownerCount === 1) {
      throw new BadRequestException('Board must have at least one owner');
    }

    board.members = board.members.filter((m) => m.userId.toString() !== targetUserId) as typeof board.members;
    await board.save();
  }

  async getBoardForPermissionCheck(boardId: string): Promise<{ members: { userId: Types.ObjectId; role: Role }[] } | null> {
    return this.boardModel.findById(boardId).select('members').lean().exec();
  }

  // ── Share link ──────────────────────────────────────────────────────────────

  async generateShareLink(boardId: string, role: Role): Promise<{ token: string; shareRole: Role }> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) throw new NotFoundException('Board not found');

    const token = randomBytes(24).toString('hex');
    board.shareToken = token;
    board.shareRole = role;
    await board.save();

    return { token, shareRole: role };
  }

  async deleteShareLink(boardId: string): Promise<void> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) throw new NotFoundException('Board not found');
    board.shareToken = null;
    await board.save();
  }

  async getShareInfo(boardId: string): Promise<{ token: string | null; shareRole: Role }> {
    const board = await this.boardModel.findById(boardId).select('shareToken shareRole').lean().exec();
    if (!board) throw new NotFoundException('Board not found');
    return { token: board.shareToken ?? null, shareRole: board.shareRole };
  }

  async getBoardPreviewByToken(token: string): Promise<{ name: string; role: Role } | null> {
    const board = await this.boardModel.findOne({ shareToken: token }).select('name shareRole').lean().exec();
    if (!board) return null;
    return { name: board.name, role: board.shareRole };
  }

  async joinViaShareLink(token: string, userId: string): Promise<{ boardId: string; role: Role }> {
    const board = await this.boardModel.findOne({ shareToken: token }).exec();
    if (!board) throw new NotFoundException('Invalid or expired share link');

    const alreadyMember = board.members.some((m) => m.userId.toString() === userId);
    if (alreadyMember) {
      return { boardId: (board._id as Types.ObjectId).toString(), role: board.shareRole };
    }

    board.members.push({ userId: new Types.ObjectId(userId), role: board.shareRole });
    await board.save();

    return { boardId: (board._id as Types.ObjectId).toString(), role: board.shareRole };
  }
}
