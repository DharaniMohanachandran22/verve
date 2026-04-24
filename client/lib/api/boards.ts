import api from '../api-client';
import type { BoardDetail, BoardSummary, MemberResponse, Role } from '../types/board';

export const createBoard = (name: string): Promise<BoardDetail> =>
  api.post('/boards', { name }) as unknown as Promise<BoardDetail>;

export const listBoards = (): Promise<BoardSummary[]> =>
  api.get('/boards') as unknown as Promise<BoardSummary[]>;

export const getBoard = (boardId: string): Promise<BoardDetail> =>
  api.get(`/boards/${boardId}`) as unknown as Promise<BoardDetail>;

export const deleteBoard = (boardId: string): Promise<void> =>
  api.delete(`/boards/${boardId}`) as unknown as Promise<void>;

export const listMembers = (boardId: string): Promise<MemberResponse[]> =>
  api.get(`/boards/${boardId}/members`) as unknown as Promise<MemberResponse[]>;

export const inviteMember = (boardId: string, email: string, role: Role): Promise<MemberResponse> =>
  api.post(`/boards/${boardId}/members`, { email, role }) as unknown as Promise<MemberResponse>;

export const updateMemberRole = (boardId: string, userId: string, role: Role, newOwnerId?: string): Promise<MemberResponse> =>
  api.patch(`/boards/${boardId}/members/${userId}`, {
    role,
    ...(newOwnerId ? { newOwnerId } : {}),
  }) as unknown as Promise<MemberResponse>;

export const removeMember = (boardId: string, userId: string): Promise<void> =>
  api.delete(`/boards/${boardId}/members/${userId}`) as unknown as Promise<void>;
