'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useBoardContext } from '../../lib/BoardContext';
import List from './List';
import api from '../../lib/api-client';
import { Plus, X, Layout } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { useNotification } from '../../contexts/NotificationContext';

export default function Board() {
  const { board, currentUserRole, filters } = useBoardContext();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';

  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const addListInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingList) addListInputRef.current?.focus();
  }, [addingList]);

  // Apply filters to cards
  const filteredLists = board?.lists.map((list) => ({
    ...list,
    cards: (list.cards || []).filter((card) => {
      if (filters.labelIds.length > 0) {
        if (!card.labels.some(lId => filters.labelIds.includes(lId))) return false;
      }
      if (filters.assigneeId && card.assignee !== filters.assigneeId) return false;
      if (filters.priority && card.priority !== filters.priority) return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!card.title.toLowerCase().includes(query) &&
          !card.description?.toLowerCase().includes(query)) return false;
      }
      return true;
    }),
  })) || [];

  const moveListMutation = useMutation({
    mutationFn: ({ listId, position }: { listId: string; position: number }) =>
      api.patch(`/lists/${listId}/position`, { position }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', board?.id] }),
  });

  const moveCardMutation = useMutation({
    mutationFn: ({ cardId, listId, position }: { cardId: string; listId: string; position: number }) =>
      api.patch(`/cards/${cardId}/move`, { listId, position }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', board?.id] }),
  });

  const addListMutation = useMutation({
    mutationFn: ({ name, position }: { name: string; position: number }) =>
      api.post(`/boards/${board!.id}/lists`, { name, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board?.id] });
      setNewListName('');
      setAddingList(false);
    },
    onError: (error: any) => {
      const msg = error.message || 'Failed to create list';
      if (msg.toLowerCase().includes('already exists')) {
        showNotification(`A list named "${newListName.trim()}" already exists on this board. Please use a different name.`, 'warning');
      } else {
        showNotification(msg, 'error');
      }
    },
  });

  const onDragEnd = (result: DropResult) => {
    if (!canEdit || !result.destination || !board) return;
    if (
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    ) return;

    if (result.type === 'LIST') {
      const newLists = Array.from(board.lists);
      const [moved] = newLists.splice(result.source.index, 1);
      newLists.splice(result.destination.index, 0, moved);

      const prev = newLists[result.destination.index - 1];
      const next = newLists[result.destination.index + 1];
      let newPos = 1024;
      if (prev && next) newPos = (prev.position + next.position) / 2;
      else if (prev) newPos = prev.position + 1024;
      else if (next) newPos = next.position / 2;

      moveListMutation.mutate({ listId: moved.id, position: newPos });
    }

    if (result.type === 'CARD') {
      const sourceList = board.lists.find((l) => l.id === result.source.droppableId);
      const destList = board.lists.find((l) => l.id === result.destination!.droppableId);
      if (!sourceList || !destList) return;

      const sourceCards = Array.from(sourceList.cards);
      const destCards = sourceList === destList ? sourceCards : Array.from(destList.cards);
      const [movedCard] = sourceCards.splice(result.source.index, 1);
      destCards.splice(result.destination.index, 0, movedCard);

      const prev = destCards[result.destination.index - 1];
      const next = destCards[result.destination.index + 1];
      let newPos = 1024;
      if (prev && next) newPos = (prev.position + next.position) / 2;
      else if (prev) newPos = prev.position + 1024;
      else if (next) newPos = next.position / 2;

      moveCardMutation.mutate({ cardId: movedCard.id, listId: destList.id, position: newPos });
    }
  };

  const handleAddList = () => {
    const name = newListName.trim();
    if (!name || !board) return;
    const lastList = board.lists[board.lists.length - 1];
    const position = lastList ? lastList.position + 1024 : 1024;
    addListMutation.mutate({ name, position });
  };

  const handleAddListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddList();
    if (e.key === 'Escape') { setAddingList(false); setNewListName(''); }
  };

  if (!board) return null;

  return (
    <div className="flex h-full flex-col">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-1 items-start gap-5 overflow-x-auto px-6 pb-6 pt-2 scrollbar-hide"
            >
              {filteredLists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index} isDragDisabled={!canEdit}>
                  {(drag) => (
                    <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}>
                      <List list={list} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {canEdit && (
                <div className="w-72 flex-shrink-0">
                  {addingList ? (
                    <div className="rounded-2xl bg-white/90 p-4 shadow-2xl backdrop-blur-md border border-white/20 dark:bg-zinc-900/90 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                      <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        <Layout className="h-3.5 w-3.5 text-emerald-500" />
                        New List
                      </label>
                      <input
                        ref={addListInputRef}
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        onKeyDown={handleAddListKeyDown}
                        placeholder="Enter list name..."
                        className="mb-4 w-full rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-900 placeholder-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleAddList}
                          disabled={!newListName.trim() || addListMutation.isPending}
                          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {addListMutation.isPending ? 'Creating...' : 'Create List'}
                        </button>
                        <button
                          onClick={() => { setAddingList(false); setNewListName(''); }}
                          className="rounded-xl p-2.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingList(true)}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 font-bold text-emerald-700 transition-all hover:bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/20 hover:border-emerald-500/40 shadow-sm dark:bg-white/5 dark:text-emerald-400"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors group-hover:text-white">
                        <Plus className="h-5 w-5" />
                      </div>
                      <span className="text-sm tracking-tight">Add another list</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
