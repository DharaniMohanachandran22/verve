'use client';

import React, { useState, useRef } from 'react';
import { useBoardContext } from '../../lib/BoardContext';
import { CardDetail } from '../../lib/types/board';
import { Calendar, MoreHorizontal, User, Eye } from 'lucide-react';
import api from '../../lib/api-client';
import CardModal from './CardModal';
import ConfirmModal from '../ui/ConfirmModal';
import CardActionsModal from './CardActionsModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface Props {
  card: CardDetail;
}

export default function Card({ card }: Props) {
  const { board, currentUserRole } = useBoardContext();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';
  const { showNotification } = useNotification();

  const archiveMutation = useMutation({
    mutationFn: () => api.delete(`/cards/${card.id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board?.id] });
      setIsConfirmingArchive(false);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to archive card', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/cards/${card.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board?.id] });
      setIsConfirmingDelete(false);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to delete card', 'error');
    },
  });

  const copyMutation = useMutation({
    mutationFn: (title: string) => api.post(`/cards/${card.id}/copy`, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', board?.id] }),
    onError: (error: any) => {
      showNotification(error.message || 'Failed to copy card', 'error');
    },
  });

  const moveMutation = useMutation({
    mutationFn: (listId: string) => api.patch(`/cards/${card.id}/move`, { listId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', board?.id] }),
    onError: (error: any) => {
      showNotification(error.message || 'Failed to move card', 'error');
    },
  });

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleActionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect());
    }
    setIsActionsOpen(!isActionsOpen);
  };

  const isWatched = card.watchers?.includes(currentUser?.id || '');

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative flex cursor-pointer flex-col rounded-xl border border-zinc-200 bg-emerald-50/40 p-4 shadow-sm transition-all hover:bg-emerald-50/60 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 dark:bg-zinc-900/60 dark:border-zinc-800 dark:hover:border-emerald-900"
      >
        {/* Watch Indicator at top */}
        {isWatched && (
          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm animate-in fade-in zoom-in duration-300">
            <Eye className="h-3 w-3" />
          </div>
        )}

        <div className={cn("mb-3 flex items-start justify-between", isWatched && "pr-6")}>
          <div className="flex-1">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-tight block">
              {card.title}
            </span>
          </div>
          {canEdit && (
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={handleActionsClick}
                className={cn(
                  "ml-2 rounded-lg p-1 transition-all active:scale-95",
                  isActionsOpen
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              <CardActionsModal
                isOpen={isActionsOpen}
                onClose={() => setIsActionsOpen(false)}
                cardId={card.id}
                cardTitle={card.title}
                onArchive={() => setIsConfirmingArchive(true)}
                onDelete={() => setIsConfirmingDelete(true)}
                onCopy={(title) => copyMutation.mutate(title)}
                onMove={(listId) => moveMutation.mutate(listId)}
                anchorRect={anchorRect}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {card.labels.map((lId) => {
            const label = board?.labels.find(l => l.id === lId);
            if (!label) return null;
            return (
              <div
                key={lId}
                className={cn(
                  "h-1.5 w-8 rounded-full shadow-sm ring-1 ring-white/20",
                  label.color === 'emerald' && 'bg-emerald-500',
                  label.color === 'blue' && 'bg-blue-500',
                  label.color === 'red' && 'bg-red-500',
                  label.color === 'yellow' && 'bg-yellow-400',
                  label.color === 'purple' && 'bg-purple-500',
                  label.color === 'pink' && 'bg-pink-500',
                )}
              />
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {card.dueDate && (
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 border border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700">
              <Calendar className="h-3 w-3 text-emerald-500" />
              <span>{new Date(card.dueDate).toLocaleDateString()}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CardModal
          cardId={card.id}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmingArchive}
        onClose={() => setIsConfirmingArchive(false)}
        onConfirm={() => archiveMutation.mutate()}
        title="Archive Card?"
        message={`Are you sure you want to archive "${card.title}"? You can restore it later from board settings.`}
        confirmLabel="Archive"
        isDanger={false}
        isPending={archiveMutation.isPending}
      />

      <ConfirmModal
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Card Permanentely?"
        message={`Are you sure you want to permanently delete "${card.title}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDanger={true}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
