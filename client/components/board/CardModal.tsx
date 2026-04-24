'use client';

import React, { useEffect, useState } from 'react';
import { X, AlignLeft, CheckSquare, MessageSquare, User, Calendar, Paperclip, Archive, Eye, Trash2, Tag, Plus } from 'lucide-react';
import LabelPopover from './LabelPopover';
import { CardDetail } from '../../lib/types/board';
import api from '../../lib/api-client';
import { useBoardContext } from '../../lib/BoardContext';
import CardChecklist from './CardChecklist';
import CardAttachments from './CardAttachments';
import CardActivity from './CardActivity';
import CardWatchers from './CardWatchers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AssigneePicker from './AssigneePicker';
import CreateChecklistModal from './CreateChecklistModal';
import AttachmentModal from './AttachmentModal';

import ConfirmModal from '../ui/ConfirmModal';

interface Props {
    cardId: string;
    onClose: () => void;
}

export default function CardModal({ cardId, onClose }: Props) {
    const { board, refresh, currentUserRole, members } = useBoardContext();
    const queryClient = useQueryClient();
    const [description, setDescription] = useState('');
    const [isEditingDesc, setIsEditingDesc] = useState(false);

    // Modal states
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
    const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
    const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const isValidId = !!cardId && cardId !== 'undefined' && /^[a-f\d]{24}$/i.test(cardId);

    const { data: card, isLoading } = useQuery({
        queryKey: ['card', cardId],
        queryFn: () => api.get(`/cards/${cardId}`).then((res) => res as unknown as CardDetail),
        enabled: isValidId,
    });

    useEffect(() => {
        if (card) {
            setDescription(card.description || '');
        }
    }, [card]);

    const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';

    const updateDescMutation = useMutation({
        mutationFn: (newDesc: string) => api.patch(`/cards/${cardId}`, { description: newDesc }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['card', cardId] });
            queryClient.invalidateQueries({ queryKey: ['board', board?.id] });
            setIsEditingDesc(false);
        },
    });

    const archiveMutation = useMutation({
        mutationFn: () => api.patch(`/cards/${cardId}`, { archived: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', board?.id] });
            onClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/cards/${cardId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', board?.id] });
            onClose();
        },
    });

    const toggleWatchMutation = useMutation({
        mutationFn: () => api.patch(`/cards/${cardId}/toggle-watch`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['card', cardId] });
        },
    });

    const assigneeMutation = useMutation({
        mutationFn: (assigneeId: string | null) =>
            api.patch(`/cards/${cardId}`, { assignee: assigneeId ?? null }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['card', cardId] });
            queryClient.invalidateQueries({ queryKey: ['board', board?.id] });
            setIsMemberPickerOpen(false);
        },
    });

    const handleUpdateDesc = () => {
        updateDescMutation.mutate(description);
    };

    const handleUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
            </div>
        );
    }

    if (!card) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md animate-in fade-in duration-500">
            <div className="relative w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-zinc-100 animate-in zoom-in-95 duration-500 overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 flex flex-col">

                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400" />

                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 z-20 rounded-2xl p-2.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all active:scale-95 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-4 sm:p-8 overflow-y-auto scrollbar-hide">
                    {/* Header - Centered Layout */}
                    <div className="mb-8 flex items-start gap-4 pr-12">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-emerald-500/10 text-emerald-600 shadow-inner">
                            <AlignLeft className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-heading text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                                {card.title}
                            </h2>
                            <p className="mt-1 flex items-center gap-2 text-xs font-bold text-zinc-400">
                                card in <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">Board</span>
                            </p>
                        </div>
                    </div>

                    <div className="mb-8 flex flex-wrap gap-8 px-1">
                        {/* Labels Section */}
                        {((card.labels && card.labels.length > 0) || canEdit) && (
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Labels</h3>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    {card.labels?.map((labelId) => {
                                        const label = board?.labels?.find((l) => l.id === labelId);
                                        if (!label) return null;
                                        return (
                                            <div
                                                key={labelId}
                                                className="h-8 min-w-[32px] rounded-lg px-3 flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.05] cursor-pointer"
                                                style={{ backgroundColor: label.color }}
                                                title={label.name}
                                            >
                                                {label.name}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Due Date Placeholder (Matching Design) */}
                        {card.dueDate && (
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Due date</h3>
                                <div className="flex items-center gap-2 rounded-lg bg-zinc-50 border border-zinc-100 p-1.5 pr-3 dark:bg-zinc-800/50 dark:border-zinc-800">
                                    <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-200 text-[10px] font-bold dark:bg-zinc-700">
                                        <Calendar className="h-3 w-3" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        {new Date(card.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-10 lg:grid-cols-4">
                        {/* Main Content */}
                        <div className="lg:col-span-3 space-y-10">
                            {/* Description */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800">
                                        <MessageSquare className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-50">Description</h3>
                                    {canEdit && !isEditingDesc && (
                                        <button
                                            onClick={() => setIsEditingDesc(true)}
                                            className="rounded-xl px-4 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 transition-all dark:hover:bg-emerald-900/10"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {isEditingDesc ? (
                                        <div className="space-y-3">
                                            <textarea
                                                autoFocus
                                                className="w-full rounded-[1.5rem] border-2 border-zinc-100 bg-zinc-50/50 p-5 text-sm font-medium text-zinc-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/5 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-white dark:focus:border-emerald-500/50"
                                                rows={4}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Add a more detailed description..."
                                            />
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleUpdateDesc}
                                                    disabled={updateDescMutation.isPending}
                                                    className="btn-primary px-8 py-2.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                                >
                                                    {updateDescMutation.isPending ? 'Saving...' : 'Save Description'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingDesc(false);
                                                        setDescription(card.description || '');
                                                    }}
                                                    className="rounded-xl px-8 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 transition-all dark:hover:bg-zinc-800"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="group">
                                            {card.description ? (
                                                <div
                                                    onClick={() => canEdit && setIsEditingDesc(true)}
                                                    className="cursor-pointer rounded-[1.5rem] border-2 border-transparent p-5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                                                >
                                                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
                                                        {card.description}
                                                    </p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => canEdit && setIsEditingDesc(true)}
                                                    className="w-full rounded-[1.5rem] border-2 border-dashed border-zinc-100 bg-zinc-50/50 p-8 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50/30 dark:bg-zinc-800/20 dark:border-zinc-800 dark:hover:border-emerald-900/30 group"
                                                >
                                                    <AlignLeft className="mx-auto mb-3 h-8 w-8 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                                                    <span className="text-sm font-bold text-zinc-400 group-hover:text-emerald-600 transition-colors">
                                                        Add a more detailed description...
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Checklists */}
                            <div className="space-y-8">
                                {card.checklists?.map((checklist) => (
                                    <CardChecklist
                                        key={checklist.id}
                                        checklist={checklist}
                                        canEdit={canEdit}
                                        onUpdate={handleUpdate}
                                    />
                                ))}
                            </div>

                            {/* Attachments Section */}
                            <CardAttachments
                                cardId={cardId}
                                attachments={card.attachments || []}
                                onUpdate={handleUpdate}
                                canEdit={canEdit}
                            />

                            {/* Activity Section */}
                            <CardActivity
                                cardId={cardId}
                                comments={card.comments || []}
                                activities={card.activities || []}
                                onUpdate={handleUpdate}
                                canEdit={canEdit}
                            />
                        </div>

                        {/* Sidebar Actions */}
                        <div className="space-y-8">
                            <CardWatchers
                                cardId={cardId}
                                boardId={board?.id || ''}
                                watchers={card.watchers || []}
                                onUpdate={handleUpdate}
                            />

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2 dark:border-zinc-800">Add to card</h4>
                                <div className="flex flex-col gap-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsLabelPopoverOpen(!isLabelPopoverOpen)}
                                            className="w-full group flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-xs font-bold text-zinc-700 transition-all hover:bg-emerald-500/10 hover:text-emerald-700 hover:translate-x-1 dark:bg-zinc-800/50 dark:text-emerald-50 dark:hover:bg-emerald-900/20"
                                        >
                                            <Tag className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600" />
                                            <span>Labels</span>
                                        </button>
                                        {isLabelPopoverOpen && (
                                            <LabelPopover
                                                cardId={cardId}
                                                boardId={board?.id || ''}
                                                activeLabelIds={card.labels || []}
                                                onClose={() => setIsLabelPopoverOpen(false)}
                                                align="right"
                                            />
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)}
                                            className="w-full group flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-xs font-bold text-zinc-700 transition-all hover:bg-emerald-500/10 hover:text-emerald-700 hover:translate-x-1 dark:bg-zinc-800/50 dark:text-emerald-50 dark:hover:bg-emerald-900/20"
                                        >
                                            <User className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600" />
                                            <span className="flex-1 text-left">Members</span>
                                            {card.assignee && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white uppercase">
                                                    {(members.find(m => m.userId === card.assignee)?.name || '?').charAt(0)}
                                                </span>
                                            )}
                                        </button>
                                        {isMemberPickerOpen && (
                                            <AssigneePicker
                                                members={members}
                                                selectedId={card.assignee}
                                                onSelect={(userId) => assigneeMutation.mutate(userId)}
                                                onClose={() => setIsMemberPickerOpen(false)}
                                            />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsChecklistModalOpen(true)}
                                        className="group flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-xs font-bold text-zinc-700 transition-all hover:bg-emerald-500/10 hover:text-emerald-700 hover:translate-x-1 dark:bg-zinc-800/50 dark:text-emerald-50 dark:hover:bg-emerald-900/20"
                                    >
                                        <CheckSquare className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600" />
                                        <span>Checklist</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2 dark:border-zinc-800">Actions</h4>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="group flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-xs font-bold text-red-500 transition-all hover:bg-red-50 hover:translate-x-1 dark:bg-zinc-800/50 dark:hover:bg-red-900/10"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-400 group-hover:text-red-600" />
                                        <span>Delete Card</span>
                                    </button>
                                    <button
                                        onClick={() => setIsArchiveModalOpen(true)}
                                        className="group flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-xs font-bold text-emerald-600 transition-all hover:bg-emerald-50 hover:translate-x-1 dark:bg-zinc-800/50 dark:hover:bg-emerald-900/10"
                                    >
                                        <Archive className="h-4 w-4 text-emerald-400 group-hover:text-emerald-600" />
                                        <span>Archive</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Modals */}
            <CreateChecklistModal
                isOpen={isChecklistModalOpen}
                onClose={() => setIsChecklistModalOpen(false)}
                cardId={cardId}
                onCreated={handleUpdate}
            />

            <AttachmentModal
                isOpen={isAttachmentModalOpen}
                onClose={() => setIsAttachmentModalOpen(false)}
                cardId={cardId}
                onUploaded={handleUpdate}
            />

            <ConfirmModal
                isOpen={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                onConfirm={() => archiveMutation.mutate()}
                isPending={archiveMutation.isPending}
                title="Archive Card?"
                message="Are you sure you want to archive this card? It will be removed from the list."
                confirmLabel="Archive"
                isDanger={false}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => deleteMutation.mutate()}
                isPending={deleteMutation.isPending}
                title="Delete Card permanently?"
                message="This will permanently delete this card. This action cannot be undone."
                confirmLabel="Delete Permanently"
                isDanger={true}
            />
        </div>
    );
}
