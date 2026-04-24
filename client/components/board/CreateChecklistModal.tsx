'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api-client';
import { AlignLeft, CheckSquare } from 'lucide-react';

interface CreateChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string;
    onCreated: () => void;
}

export default function CreateChecklistModal({ isOpen, onClose, cardId, onCreated }: CreateChecklistModalProps) {
    const [title, setTitle] = useState('');

    const mutation = useMutation({
        mutationFn: (newChecklist: { title: string }) =>
            api.post(`/cards/${cardId}/checklists`, newChecklist),
        onSuccess: () => {
            setTitle('');
            onCreated();
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        mutation.mutate({ title: title.trim() });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Checklist" size="sm">
            <div className="mb-4">
                <p className="text-sm font-medium text-secondary">
                    Add a group of tasks to track progress.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider">
                        <CheckSquare className="h-3.5 w-3.5" />
                        Checklist Title
                    </label>
                    <input
                        type="text"
                        required
                        className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                        placeholder="e.g. TODO List, Task Items"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex gap-4 pt-4 border-t dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-bold text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-900 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending || !title.trim()}
                        className="btn-primary flex-1 shadow-lg active:scale-95 shadow-primary/20 transition-all"
                    >
                        {mutation.isPending ? 'Creating...' : 'Create Checklist'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
