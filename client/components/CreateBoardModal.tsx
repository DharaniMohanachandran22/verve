'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateBoardModal({ isOpen, onClose }: CreateBoardModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (newBoard: { name: string; description: string }) =>
            api.post('/boards', newBoard),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            setName('');
            setDescription('');
            onClose();
        },
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        mutation.mutate({ name, description });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-border animate-in zoom-in-95 duration-300">
                <div className="mb-8 flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Create Project</h2>
                        <p className="text-sm font-medium text-secondary">Start a new endeavor in your workspace.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-secondary hover:bg-slate-100 hover:text-foreground transition-colors active:scale-90"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="board-name" className="text-xs font-bold text-secondary uppercase tracking-wider">
                            Project Title
                        </label>
                        <input
                            id="board-name"
                            type="text"
                            required
                            className="w-full rounded-lg border border-border bg-slate-50 px-4 py-2.5 text-sm text-foreground placeholder-secondary/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            placeholder="e.g. Q4 Marketing Campaign"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="board-desc" className="text-xs font-bold text-secondary uppercase tracking-wider">
                            Description
                        </label>
                        <textarea
                            id="board-desc"
                            rows={3}
                            className="w-full rounded-lg border border-border bg-slate-50 px-4 py-2.5 text-sm text-foreground placeholder-secondary/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            placeholder="Briefly describe the guiding concept..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-bold text-secondary transition-colors hover:bg-slate-50 hover:text-foreground active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending || !name.trim()}
                            className="btn-primary flex-1 !w-auto"
                        >
                            {mutation.isPending ? 'Creating...' : 'Create Board'}
                        </button>
                    </div>
                    {mutation.isError && (
                        <p className="text-sm text-red-500 font-medium">
                            {(mutation.error as Error)?.message || 'Failed to create board. Please try again.'}
                        </p>
                    )}
                </form>
            </div>
        </div>

    );
}
