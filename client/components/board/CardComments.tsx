'use client';

import React, { useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { CommentDetail } from '../../lib/types/board';
import api from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
    cardId: string;
    comments: CommentDetail[];
    onUpdate: () => void;
    canEdit: boolean;
}

export default function CardComments({ cardId, comments, onUpdate, canEdit }: Props) {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await api.post(`/cards/${cardId}/comments`, { content: newComment });
            setNewComment('');
            onUpdate();
        } catch (err) {
            alert('Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;
        try {
            await api.delete(`/comments/${commentId}`);
            onUpdate();
        } catch (err) {
            alert('Failed to delete comment');
        }
    };

    return (
        <div className="mt-8">
            <div className="mb-6 flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-zinc-500" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Activity</h3>
            </div>

            {/* New Comment Input */}
            <div className="mb-8 flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-black text-white uppercase shadow-sm">
                    {(user?.name || user?.email || '?').charAt(0)}
                </div>
                <form onSubmit={handleAddComment} className="flex-1">
                    <textarea
                        className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        rows={1}
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    {newComment.trim() && (
                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </form>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-black text-white uppercase shadow-sm">
                            {(comment.authorId === user?.id
                                ? (user?.name || user?.email)
                                : (comment.authorName ?? 'U')
                            ).charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                                    {comment.authorId === user?.id
                                        ? (user.name ?? 'You')
                                        : (comment.authorName ?? 'Unknown')}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {new Date(comment.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div className="rounded-lg bg-white p-3 text-sm shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
                                {comment.content}
                            </div>
                            <div className="mt-1 flex gap-3 text-xs text-zinc-500">
                                {(canEdit || comment.authorId === user?.id) && (
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="hover:text-red-500 hover:underline"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {comments.length === 0 && (
                    <p className="ml-12 text-sm text-zinc-500">No activity yet.</p>
                )}
            </div>
        </div>
    );
}
