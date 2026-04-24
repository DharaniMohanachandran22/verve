'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
    cardId: string;
    boardId: string;
    watchers: string[];
    onUpdate: () => void;
}

export default function CardWatchers({ cardId, boardId, watchers, onUpdate }: Props) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [optimisticWatching, setOptimisticWatching] = useState<boolean | null>(null);

    const isWatching = optimisticWatching ?? !!(user && watchers.includes(user.id));

    const toggleWatchMutation = useMutation({
        mutationFn: async (currentlyWatching: boolean) => {
            if (currentlyWatching) {
                return api.delete(`/cards/${cardId}/watchers`);
            } else {
                return api.post(`/cards/${cardId}/watchers`);
            }
        },
        onSuccess: (_data, currentlyWatching) => {
            const userId = user!.id;
            const newWatching = !currentlyWatching;

            // Update the card detail cache immediately
            queryClient.setQueryData(['card', cardId], (old: any) => {
                if (!old) return old;
                const updatedWatchers = newWatching
                    ? [...(old.watchers || []), userId]
                    : (old.watchers || []).filter((w: string) => w !== userId);
                return { ...old, watchers: updatedWatchers };
            });

            // Update the board cache so the eye icon on the card tile updates too
            queryClient.setQueryData(['board', boardId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    lists: old.lists?.map((list: any) => ({
                        ...list,
                        cards: list.cards?.map((card: any) => {
                            if (card.id !== cardId) return card;
                            const updatedWatchers = newWatching
                                ? [...(card.watchers || []), userId]
                                : (card.watchers || []).filter((w: string) => w !== userId);
                            return { ...card, watchers: updatedWatchers };
                        }),
                    })),
                };
            });

            setOptimisticWatching(null);
            onUpdate();
        },
        onError: () => {
            setOptimisticWatching(null);
        },
    });

    const toggleWatch = () => {
        if (user) {
            setOptimisticWatching(!isWatching);
            toggleWatchMutation.mutate(isWatching);
        }
    };

    const watcherCount = optimisticWatching !== null
        ? optimisticWatching
            ? watchers.includes(user?.id ?? '') ? watchers.length : watchers.length + 1
            : watchers.filter(w => w !== user?.id).length
        : watchers.length;

    return (
        <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Notifications</h4>
                <button
                    onClick={toggleWatch}
                    disabled={toggleWatchMutation.isPending}
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isWatching
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                            : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    )}
                >
                    {isWatching ? (
                        <><Eye className="h-4 w-4" /> Watching</>
                    ) : (
                        <><EyeOff className="h-4 w-4" /> Watch</>
                    )}
                    {watcherCount > 0 && (
                        <span className="ml-1 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                            {watcherCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
