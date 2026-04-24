'use client';

import React, { useState } from 'react';
import { MessageSquare, Trash2, History } from 'lucide-react';
import { CommentDetail, ActivityDetail } from '../../lib/types/board';
import api from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { useMutation } from '@tanstack/react-query';

interface Props {
    cardId: string;
    comments: CommentDetail[];
    activities: ActivityDetail[];
    onUpdate: () => void;
    canEdit: boolean;
}

type UnifiedActivity =
    | { type: 'comment'; data: CommentDetail }
    | { type: 'action'; data: ActivityDetail };

export default function CardActivity({ cardId, comments, activities, onUpdate, canEdit }: Props) {
    const [newComment, setNewComment] = useState('');
    const { user } = useAuth();

    const addCommentMutation = useMutation({
        mutationFn: (content: string) => api.post(`/cards/${cardId}/comments`, { content }),
        onSuccess: () => {
            setNewComment('');
            onUpdate();
        },
    });

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: string) => api.delete(`/comments/${commentId}`),
        onSuccess: () => {
            onUpdate();
        },
    });

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            addCommentMutation.mutate(newComment);
        }
    };

    const handleDeleteComment = (commentId: string) => {
        deleteCommentMutation.mutate(commentId);
    };

    // Show only comments
    const feed = comments.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className="mt-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-zinc-900 dark:text-zinc-50">Comments</h3>
                </div>
            </div>

            <div className="mb-10">
                <form onSubmit={handleAddComment} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-black text-white uppercase shadow-sm">
                            {(user?.name || user?.email || '?').charAt(0)}
                        </div>
                        <div className="flex-1">
                            <textarea
                                className="w-full rounded-[1.5rem] border-2 border-zinc-100 bg-zinc-50/50 p-4 text-sm font-medium text-zinc-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/5 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-white dark:focus:border-emerald-500/50"
                                rows={2}
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                        </div>
                    </div>
                    {newComment.trim() && (
                        <div className="flex justify-end pr-1 transition-all animate-in fade-in slide-in-from-top-2">
                            <button
                                disabled={addCommentMutation.isPending}
                                type="submit"
                                className="btn-primary px-8 py-2.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                {addCommentMutation.isPending ? 'Saving...' : 'Save Comment'}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
                {feed.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-black text-white uppercase shadow-sm">
                            {(comment.authorId === user?.id
                                ? (user?.name || user?.email || '?')
                                : (comment.authorName || '?')
                            ).charAt(0)}
                        </div>

                        <div className="flex-1">
                            <div className="mb-1.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                                        {comment.authorId === user?.id
                                            ? (user.name ?? 'You')
                                            : (comment.authorName ?? comment.authorId)}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {comment.authorId === user?.id && (
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="rounded-2xl bg-white border border-zinc-100 p-4 text-sm font-medium leading-relaxed shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                                {comment.content}
                            </div>
                        </div>
                    </div>
                ))}
                {feed.length === 0 && (
                    <div className="h-2" />
                )}
            </div>
        </div>
    );
}
