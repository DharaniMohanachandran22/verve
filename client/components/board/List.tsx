'use client';

import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useBoardContext } from '../../lib/BoardContext';
import Card from './Card';
import { cn } from '../../lib/utils';
import { MoreHorizontal, Plus, X, Eye } from 'lucide-react';
import { ListDetail } from '../../lib/types/board';
import AddCardModal from './AddCardModal';
import ListActionsModal from './ListActionsModal';
import ConfirmModal from '../ui/ConfirmModal';
import api from '../../lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface Props {
  list: ListDetail;
}

export default function List({ list }: Props) {
  const { currentUserRole, board } = useBoardContext();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [addingCard, setAddingCard] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';

  const invalidateBoard = () => {
    queryClient.invalidateQueries({ queryKey: ['board', board?.id] });
  };

  const archiveMutation = useMutation({
    mutationFn: () => api.delete(`/lists/${list.id}/archive`),
    onSuccess: () => {
      invalidateBoard();
      setIsArchiveModalOpen(false);
    }
  });

  const copyMutation = useMutation({
    mutationFn: (name: string) => api.post(`/lists/${list.id}/copy`, { name }),
    onSuccess: invalidateBoard,
    onError: (error: any) => {
      const msg = error.message || 'Failed to copy list';
      if (msg.toLowerCase().includes('already exists')) {
        showNotification(`A list with that name already exists on this board. Please use a different name.`, 'warning');
      } else {
        showNotification(msg, 'error');
      }
    },
  });

  const moveAllCardsMutation = useMutation({
    mutationFn: (targetListId: string) => api.patch(`/lists/${list.id}/move-all-cards`, { targetListId }),
    onSuccess: invalidateBoard
  });

  const sortMutation = useMutation({
    mutationFn: (sortBy: 'newest' | 'oldest' | 'name') => api.patch(`/lists/${list.id}/sort`, { sortBy }),
    onSuccess: invalidateBoard
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/lists/${list.id}`),
    onSuccess: () => {
      invalidateBoard();
      setIsDeleteModalOpen(false);
    }
  });



  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-2xl bg-zinc-100/80 p-3 shadow-md border border-zinc-200 dark:bg-zinc-900/80 dark:border-zinc-800 h-fit max-h-[calc(100vh-140px)]">
      <div className="mb-3 flex items-center justify-between px-2 relative shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{list.name}</h3>

        </div>
        {canEdit && (
          <button
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className={cn(
              "rounded-lg p-1.5 transition-all active:scale-95",
              isActionsOpen
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            )}
          >
            {isActionsOpen ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
          </button>
        )}

        {canEdit && (
          <ListActionsModal
          isOpen={isActionsOpen}
          onClose={() => setIsActionsOpen(false)}
          listId={list.id}
          listName={list.name}
          onAddCard={() => setAddingCard(true)}
          onArchive={() => setIsArchiveModalOpen(true)}
          onCopy={(name) => copyMutation.mutate(name)}
          onMoveAllCards={(tid) => moveAllCardsMutation.mutate(tid)}
          onSort={(s) => sortMutation.mutate(s)}
          onDelete={() => setIsDeleteModalOpen(true)}
        />
        )}
      </div>

      <Droppable droppableId={list.id} type="CARD">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="mb-2 min-h-[4px] space-y-2.5 overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-hide px-0.5"
          >
            {list.cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index} isDragDisabled={!canEdit}>
                {(drag) => (
                  <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}>
                    <Card card={card} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {canEdit && (
        <div className="shrink-0 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <button
            onClick={() => setAddingCard(true)}
            className="flex items-center gap-2 rounded-xl p-3 text-sm font-bold text-zinc-500 transition-all hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-500 group w-full"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-200 group-hover:bg-emerald-500 transition-colors" title="Add Card">
              <Plus className="h-3 w-3 text-zinc-600 group-hover:text-white" />
            </div>
            Add a card
          </button>

          <AddCardModal
            isOpen={addingCard}
            onClose={() => setAddingCard(false)}
            listId={list.id}
            listName={list.name}
          />
        </div>
      )}

      {/* Archive List Confirmation Modal */}
      <ConfirmModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={() => archiveMutation.mutate()}
        isPending={archiveMutation.isPending}
        title="Archive List?"
        message={`Are you sure you want to archive "${list.name}" and all its cards? This will remove it from the board view.`}
        confirmLabel="Archive"
        isDanger={false}
      />

      {/* Delete List Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
        title="Delete List permanently?"
        message={`This will permanently delete "${list.name}" AND all its cards. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDanger={true}
      />
    </div>
  );
}
