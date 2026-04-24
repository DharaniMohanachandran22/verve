'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api-client';
import { useBoardContext } from '../../lib/BoardContext';
import { cn } from '../../lib/utils';
import { Layout, FileText, BarChart } from 'lucide-react';
import { Priority } from '../../lib/types/board';
import { useNotification } from '../../contexts/NotificationContext';

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    listId: string;
    listName: string;
}

export default function AddCardModal({ isOpen, onClose, listId, listName }: AddCardModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.Medium);
    const queryClient = useQueryClient();
    const { board } = useBoardContext();
    const { showNotification } = useNotification();

    const mutation = useMutation({
        mutationFn: (newCard: { title: string; description: string; priority: Priority; position: number }) =>
            api.post(`/lists/${listId}/cards`, newCard),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', board?.id] });
            setTitle('');
            setDescription('');
            setPriority(Priority.Medium);
            onClose();
        },
        onError: (error: any) => {
            const msg = error.message || 'Failed to create card';
            if (msg.toLowerCase().includes('already exists')) {
                showNotification(`A card named "${title.trim()}" already exists in this list. Please use a different name.`, 'warning');
            } else {
                showNotification(msg, 'error');
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !board) return;

        // Find current list and last card position
        const list = board.lists.find(l => l.id === listId);
        const lastCard = list?.cards[list.cards.length - 1];
        const position = lastCard ? lastCard.position + 1024 : 1024;

        mutation.mutate({ title, description, priority, position });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Card" size="md">
            <div className="mb-6">
                <p className="text-sm font-medium text-zinc-500">
                    Adding to <span className="font-extrabold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg dark:bg-emerald-900/20">{listName}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                        <Layout className="h-3.5 w-3.5 text-emerald-500" />
                        Card Title
                    </label>
                    <input
                        type="text"
                        required
                        className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-4 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold placeholder:text-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        placeholder="What needs to be done?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                        <FileText className="h-3.5 w-3.5 text-emerald-500" />
                        Description
                    </label>
                    <textarea
                        rows={4}
                        className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-4 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium resize-none placeholder:text-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        placeholder="Add more details about this task..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                        <BarChart className="h-4 w-4 text-emerald-500" />
                        Priority Level
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                        {Object.values(Priority).map((p) => {
                            const isActive = priority === p;
                            const colors = {
                                [Priority.Low]: 'bg-slate-100 text-slate-600 border-slate-200',
                                [Priority.Medium]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                [Priority.High]: 'bg-orange-50 text-orange-600 border-orange-100',
                                [Priority.Urgent]: 'bg-red-50 text-red-600 border-red-100',
                            };
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={cn(
                                        "rounded-2xl py-3 text-[10px] font-black transition-all border-2",
                                        isActive
                                            ? colors[p] + " border-emerald-500 shadow-lg shadow-emerald-500/10 scale-105"
                                            : "bg-white border-zinc-100 text-zinc-400 hover:border-emerald-200 dark:bg-zinc-800 dark:border-zinc-700"
                                    )}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-2xl py-4 text-sm font-bold text-zinc-400 transition-all hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 dark:hover:bg-zinc-800 dark:hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending || !title.trim()}
                        className="btn-primary flex-[2] py-4 shadow-xl shadow-emerald-500/20 text-xs tracking-widest uppercase font-black"
                    >
                        {mutation.isPending ? 'Syncing...' : 'Create Card'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
