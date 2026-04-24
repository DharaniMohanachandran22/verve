'use client';

import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, User, Check } from 'lucide-react';
import { ChecklistDetail, MemberResponse } from '../../lib/types/board';
import api from '../../lib/api-client';
import { cn } from '../../lib/utils';
import { useMutation } from '@tanstack/react-query';
import ConfirmModal from '../ui/ConfirmModal';
import { useBoardContext } from '../../lib/BoardContext';
import AssigneePicker from './AssigneePicker';

interface Props {
    checklist: ChecklistDetail;
    onUpdate: () => void;
    canEdit: boolean;
}

export default function CardChecklist({ checklist, onUpdate, canEdit }: Props) {
    const [newItemTitle, setNewItemTitle] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [activePickerId, setActivePickerId] = useState<string | null>(null);
    const { members } = useBoardContext();

    const addItemMutation = useMutation({
        mutationFn: (text: string) => api.post(`/checklists/${checklist.id}/items`, { text }),
        onSuccess: () => {
            setNewItemTitle('');
            setIsAddingItem(false);
            onUpdate();
        },
    });

    const toggleItemMutation = useMutation({
        mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
            api.patch(`/checklists/${checklist.id}/items/${itemId}`, { completed: !completed }),
        onSuccess: () => {
            onUpdate();
        },
    });

    const updateAssigneeMutation = useMutation({
        mutationFn: ({ itemId, assignee }: { itemId: string; assignee: string | null }) =>
            api.patch(`/checklists/${checklist.id}/items/${itemId}`, { assignee }),
        onSuccess: () => {
            onUpdate();
            setActivePickerId(null);
        },
    });

    const deleteItemMutation = useMutation({
        mutationFn: (itemId: string) => api.delete(`/checklists/${checklist.id}/items/${itemId}`),
        onSuccess: () => {
            onUpdate();
        },
    });

    const deleteChecklistMutation = useMutation({
        mutationFn: () => api.delete(`/checklists/${checklist.id}`),
        onSuccess: () => {
            onUpdate();
            setIsConfirmOpen(false);
        },
    });

    const handleAddItem = () => {
        if (newItemTitle.trim()) {
            addItemMutation.mutate(newItemTitle);
        }
    };

    const handleToggleItem = (itemId: string, completed: boolean) => {
        toggleItemMutation.mutate({ itemId, completed });
    };

    const handleDeleteItem = (itemId: string) => {
        deleteItemMutation.mutate(itemId);
    };

    const completedCount = checklist.items.filter((i) => i.completed).length;
    const totalCount = checklist.items.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="group/checklist mb-10 last:mb-0">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <CheckSquare className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-zinc-900 dark:text-zinc-50">{checklist.title}</h3>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setIsConfirmOpen(true)}
                        className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-500 opacity-0 group-hover/checklist:opacity-100 hover:bg-red-100 transition-all dark:border-red-900/20 dark:bg-red-900/10"
                    >
                        Delete Checklist
                    </button>
                )}
            </div>

            <div className="ml-14">
                {/* Progress Bar */}
                <div className="mb-8 pr-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-600">{percent}% Complete</span>
                        <span className="text-xs font-bold text-zinc-400">{completedCount}/{totalCount} Items</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)]",
                                percent === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                            )}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                    {checklist.items.map((item) => {
                        const itemId = item.id || (item as any)._id;
                        const assignee = members.find(m => m.userId === item.assignee);

                        return (
                            <div
                                key={itemId}
                                className="group flex items-center gap-4 rounded-xl p-2 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                            >
                                <div
                                    onClick={() => canEdit && handleToggleItem(itemId, item.completed)}
                                    className={cn(
                                        "h-5 w-5 shrink-0 cursor-pointer rounded-lg border-2 flex items-center justify-center transition-all",
                                        item.completed
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                            : "border-emerald-200 bg-white dark:bg-zinc-900 dark:border-zinc-700 hover:border-emerald-500"
                                    )}
                                >
                                    {item.completed && <Check className="h-3 w-3 stroke-[4px]" />}
                                </div>
                                <span
                                    className={cn(
                                        "flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer select-none",
                                        item.completed && "text-zinc-400 line-through decoration-zinc-300"
                                    )}
                                    onClick={() => canEdit && handleToggleItem(itemId, item.completed)}
                                >
                                    {item.text || item.content}
                                </span>

                                <div className="flex items-center gap-2 pr-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => canEdit && setActivePickerId(activePickerId === itemId ? null : itemId)}
                                            className={cn(
                                                "flex h-7 w-7 items-center justify-center rounded-lg border transition-all hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                                                assignee ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-200 text-zinc-400 dark:border-zinc-700"
                                            )}
                                            title={assignee ? `Assigned to ${assignee.name || assignee.email}` : "Add assignee"}
                                        >
                                            {assignee ? (
                                                <span className="text-[10px] font-black">
                                                    {(assignee.name || assignee.email || 'U').charAt(0).toUpperCase()}
                                                </span>
                                            ) : (
                                                <User className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                        {activePickerId === itemId && (
                                            <AssigneePicker
                                                members={members}
                                                selectedId={item.assignee}
                                                onSelect={(userId) => updateAssigneeMutation.mutate({ itemId, assignee: userId })}
                                                onClose={() => setActivePickerId(null)}
                                            />
                                        )}
                                    </div>

                                    {canEdit && (
                                        <button
                                            onClick={() => handleDeleteItem(itemId)}
                                            className="rounded-lg p-1.5 text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Item Action */}
                <div className="mt-6">
                    {isAddingItem ? (
                        <div className="space-y-3">
                            <input
                                autoFocus
                                type="text"
                                className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50/50 px-5 py-3 text-sm font-medium text-zinc-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                placeholder="What needs to be done?"
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddItem}
                                    disabled={addItemMutation.isPending || !newItemTitle.trim()}
                                    className="btn-primary px-6 py-2 text-xs"
                                >
                                    {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
                                </button>
                                <button
                                    onClick={() => setIsAddingItem(false)}
                                    className="rounded-xl px-6 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        canEdit && (
                            <button
                                onClick={() => setIsAddingItem(true)}
                                className="flex items-center gap-2 rounded-xl bg-emerald-500/5 px-4 py-2 text-xs font-bold text-emerald-600 transition-all hover:bg-emerald-500/10 hover:translate-x-1"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add an item
                            </button>
                        )
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => deleteChecklistMutation.mutate()}
                title="Delete Checklist"
                message={`Are you sure you want to delete "${checklist.title}"? This action cannot be undone.`}
                isDanger
                isPending={deleteChecklistMutation.isPending}
            />
        </div>
    );
}
