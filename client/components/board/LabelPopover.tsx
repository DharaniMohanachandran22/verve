'use client';

import React, { useState } from 'react';
import { X, Search, Edit2, Check, Trash2, ChevronLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api-client';
import { LabelDetail } from '../../lib/types/board';
import { cn } from '../../lib/utils';
import { useNotification } from '../../contexts/NotificationContext';

interface LabelPopoverProps {
    cardId: string;
    boardId: string;
    activeLabelIds: string[];
    onClose: () => void;
    align?: 'left' | 'right';
}

const PRESET_COLORS = [
    { name: 'Green', color: '#22c55e' },
    { name: 'Yellow', color: '#eab308' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Red', color: '#ef4444' },
    { name: 'Purple', color: '#a855f7' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Sky', color: '#0ea5e9' },
    { name: 'Pink', color: '#ec4899' },
    { name: 'Slate', color: '#64748b' },
];

export default function LabelPopover({ cardId, boardId, activeLabelIds, onClose, align = 'right' }: LabelPopoverProps) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [editingLabel, setEditingLabel] = useState<LabelDetail | null>(null);
    const [newLabelName, setNewLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].color);

    const { data: boardLabels = [] } = useQuery({
        queryKey: ['labels', boardId],
        queryFn: () => api.get(`/boards/${boardId}/labels`).then(res => res as unknown as LabelDetail[]),
    });

    const { showNotification } = useNotification();

    const toggleLabelMutation = useMutation({
        mutationFn: ({ labelId, isActive }: { labelId: string; isActive: boolean }) =>
            isActive
                ? api.delete(`/cards/${cardId}/labels/${labelId}`)
                : api.post(`/cards/${cardId}/labels`, { labelId }),
        onMutate: ({ labelId, isActive }) => {
            // Immediately update the card cache — no separate local state needed
            queryClient.setQueryData(['card', cardId], (old: any) => {
                if (!old) return old;
                const labels: string[] = old.labels ?? [];
                return {
                    ...old,
                    labels: isActive
                        ? labels.filter((id: string) => id !== labelId)
                        : [...labels, labelId],
                };
            });
        },
        onError: (_err, { labelId, isActive }) => {
            // Revert on failure
            queryClient.setQueryData(['card', cardId], (old: any) => {
                if (!old) return old;
                const labels: string[] = old.labels ?? [];
                return {
                    ...old,
                    labels: isActive
                        ? [...labels, labelId]
                        : labels.filter((id: string) => id !== labelId),
                };
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        },
    });

    const createLabelMutation = useMutation({
        mutationFn: (data: { name: string; color: string }) =>
            api.post(`/boards/${boardId}/labels`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
            setView('list');
            setNewLabelName('');
        },
        onError: (error: any) => {
            showNotification(error.message || 'Failed to create label', 'error');
        },
    });

    const updateLabelMutation = useMutation({
        mutationFn: (data: { name: string; color: string }) =>
            api.patch(`/labels/${editingLabel?.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
            queryClient.invalidateQueries({ queryKey: ['card', cardId] });
            setView('list');
            setEditingLabel(null);
        },
        onError: (error: any) => {
            showNotification(error.message || 'Failed to update label', 'error');
        },
    });

    const deleteLabelMutation = useMutation({
        mutationFn: () => api.delete(`/labels/${editingLabel?.id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
            queryClient.invalidateQueries({ queryKey: ['card', cardId] });
            setView('list');
            setEditingLabel(null);
        },
        onError: (error: any) => {
            showNotification(error.message || 'Failed to delete label', 'error');
        },
    });

    const filteredLabels = boardLabels.filter(label =>
        label.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateClick = () => {
        setNewLabelName('');
        setSelectedColor(PRESET_COLORS[0].color);
        setView('create');
    };

    const handleEditClick = (label: LabelDetail) => {
        setEditingLabel(label);
        setNewLabelName(label.name);
        setSelectedColor(label.color);
        setView('edit');
    };

    const viewTitle = view === 'create' ? 'Create Label' : 'Edit Label';

    return (
        <div className={cn(
            "absolute top-full z-[70] mt-2 w-72 rounded-3xl border border-zinc-100 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-zinc-800 dark:bg-zinc-950",
            align === 'right' ? "right-0" : "left-0"
        )}>
            <div className="mb-4 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setView('list')}
                    className={cn("text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200", view === 'list' && "invisible")}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                    {view === 'list' ? 'Labels' : viewTitle}
                </h3>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {view === 'list' ? (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search labels..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2 pl-10 pr-4 text-xs font-medium focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                        />
                    </div>

                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {filteredLabels.map((label) => {
                            const isActive = activeLabelIds.includes(label.id);
                            return (
                                <div key={label.id} className="group flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleLabelMutation.mutate({ labelId: label.id, isActive })}
                                        className={cn(
                                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all",
                                            isActive
                                                ? "border-emerald-500 bg-emerald-500 text-white"
                                                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
                                        )}
                                    >
                                        {isActive && <Check className="h-3 w-3" />}
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 h-8 rounded-lg flex items-center px-3 text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer truncate"
                                        style={{ backgroundColor: label.color }}
                                        onClick={() => toggleLabelMutation.mutate({ labelId: label.id, isActive })}
                                    >
                                        {label.name}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleEditClick(label)}
                                        className="p-1 px-2 rounded-lg text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                        {filteredLabels.length === 0 && (
                            <p className="py-4 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                No labels found
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateClick}
                        className="w-full rounded-xl bg-zinc-100 py-2.5 text-xs font-bold text-zinc-600 transition-all hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                        Create a new label
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Name</p>
                        <input
                            id="label-name"
                            type="text"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="w-full rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs font-bold focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                            placeholder="Label name..."
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select a color</p>
                        <div className="grid grid-cols-3 gap-2">
                            {PRESET_COLORS.map(({ name, color }) => (
                                <button
                                    type="button"
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={cn(
                                        "h-8 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center",
                                        selectedColor === color && "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-zinc-950"
                                    )}
                                    style={{ backgroundColor: color }}
                                    title={name}
                                >
                                    {selectedColor === color && <Check className="h-4 w-4 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => view === 'create'
                                ? createLabelMutation.mutate({ name: newLabelName, color: selectedColor })
                                : updateLabelMutation.mutate({ name: newLabelName, color: selectedColor })
                            }
                            disabled={!newLabelName.trim()}
                            className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                        >
                            {view === 'create' ? 'Create' : 'Save'}
                        </button>
                        {view === 'edit' && (
                            <button
                                type="button"
                                onClick={() => deleteLabelMutation.mutate()}
                                className="rounded-xl bg-red-500/10 p-2.5 text-red-500 transition-all hover:bg-red-500/20 active:scale-95"
                                title="Delete Label"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
