'use client';

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from './api-client';
import { useAuth } from '../contexts/AuthContext';
import type { BoardDetail, MemberResponse, Role } from './types/board';
import { useParams } from 'next/navigation';

export interface BoardFilters {
  labelIds: string[];
  assigneeId: string | null;
  priority: string | null;
  searchQuery: string;
}

interface BoardContextValue {
  board: BoardDetail | null;
  members: MemberResponse[];
  currentUserRole: Role | null;
  loading: boolean;
  error: string | null;
  filters: BoardFilters;
  refresh: () => void;
  setFilters: React.Dispatch<React.SetStateAction<BoardFilters>>;
}

const BoardContext = createContext<BoardContextValue | null>(null);

const initialFilters: BoardFilters = {
  labelIds: [],
  assigneeId: null,
  priority: null,
  searchQuery: '',
};

export function BoardProvider({ children }: { children: ReactNode }) {
  const { boardId } = useParams<{ boardId: string }>();
  const [filters, setFilters] = useState<BoardFilters>(initialFilters);
  const { user } = useAuth();

  const { data: board, isLoading: boardLoading, error: boardError, refetch: refetchBoard } = useQuery<BoardDetail>({
    queryKey: ['board', boardId],
    queryFn: () => api.get(`/boards/${boardId}`),
    enabled: !!boardId && !!user,
  });

  const { data: members = [], isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useQuery<MemberResponse[]>({
    queryKey: ['board-members', boardId],
    queryFn: () => api.get(`/boards/${boardId}/members`),
    enabled: !!boardId && !!user,
  });

  const currentUserRole: Role | null = useMemo(() => {
    // Try from dedicated members query first, then fall back to board.members
    const fromMembers = members.find((m) => m.userId === user?.id)?.role;
    if (fromMembers) return fromMembers;
    const fromBoard = board?.members.find((m) => m.userId === user?.id)?.role;
    return fromBoard ?? null;
  }, [members, board, user?.id]);

  const refresh = () => {
    refetchBoard();
    refetchMembers();
  };

  const value = {
    board: board || null,
    members,
    currentUserRole,
    loading: boardLoading || membersLoading,
    error: (boardError || membersError)?.message || null,
    filters,
    refresh,
    setFilters
  };

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoardContext must be used within BoardProvider');
  return ctx;
}
