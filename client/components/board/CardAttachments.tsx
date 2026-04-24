'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Trash2, Download, File, Image, FileText, Plus, MoreHorizontal, ExternalLink, Edit2, X } from 'lucide-react';
import { AttachmentDetail } from '../../lib/types/board';
import api from '../../lib/api-client';
import { useMutation } from '@tanstack/react-query';
import ConfirmModal from '../ui/ConfirmModal';
import { cn } from '../../lib/utils';

interface Props {
    cardId: string;
    attachments: AttachmentDetail[];
    onUpdate: () => void;
    canEdit: boolean;
}

export default function CardAttachments({ cardId, attachments, onUpdate, canEdit }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<AttachmentDetail | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const uploadMutation = useMutation({
        mutationFn: (formData: FormData) =>
            api.post(`/cards/${cardId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }),
        onSuccess: () => {
            onUpdate();
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (attachmentId: string) => api.delete(`/attachments/${attachmentId}`),
        onSuccess: () => {
            onUpdate();
            setIsConfirmOpen(false);
            setSelectedAttachment(null);
        },
    });

    const renameMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            api.patch(`/attachments/${id}`, { originalname: name }),
        onSuccess: () => {
            onUpdate();
            setIsRenameModalOpen(false);
            setSelectedAttachment(null);
            setActiveMenuId(null);
        },
    });

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            uploadMutation.mutate(formData);
        }
    };

    const handleDeleteClick = (attachment: AttachmentDetail) => {
        setSelectedAttachment(attachment);
        setIsConfirmOpen(true);
        setActiveMenuId(null);
    };

    const handleRenameClick = (attachment: AttachmentDetail) => {
        setSelectedAttachment(attachment);
        setNewName(attachment.originalname || attachment.originalName || '');
        setIsRenameModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDownload = (attachmentId: string) => {
        window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/attachments/${attachmentId}`, '_blank');
        setActiveMenuId(null);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getThumbnail = (attachment: AttachmentDetail) => {
        const mime = attachment.mimetype || attachment.mimeType || '';
        const name = attachment.originalname || attachment.originalName || '';

        if (mime.startsWith('image/')) {
            return (
                <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/attachments/${attachment.id}`}
                    alt={name}
                    className="h-full w-full object-cover"
                />
            );
        }
        if (mime === 'application/pdf') {
            return <div className="flex flex-col items-center justify-center font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 h-full w-full uppercase text-[10px]">PDF</div>;
        }
        return <File className="h-6 w-6 text-zinc-400" />;
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClick = () => setActiveMenuId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="mb-10">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <Paperclip className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-zinc-900 dark:text-zinc-50">Attachments</h3>
                </div>
                {canEdit && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMutation.isPending}
                        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                        {uploadMutation.isPending ? 'Adding...' : 'Add'}
                    </button>
                )}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
            </div>

            <div className="space-y-4">
                {attachments.length > 0 && <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Files</p>}

                <div className="flex flex-col gap-3">
                    {attachments.map((attachment) => (
                        <div key={attachment.id} className="group flex items-center gap-4">
                            {/* Thumbnail */}
                            <div
                                onClick={() => handleDownload(attachment.id)}
                                className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-50 border border-zinc-100 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 dark:bg-zinc-900 dark:border-zinc-800"
                            >
                                {getThumbnail(attachment)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-none mb-1">
                                    {attachment.originalname || attachment.originalName}
                                </h4>
                                <p className="text-xs text-zinc-500 font-medium">
                                    Added {new Date(attachment.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleDownload(attachment.id)}
                                    className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === attachment.id ? null : attachment.id);
                                        }}
                                        className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>

                                    {activeMenuId === attachment.id && (
                                        <div
                                            className="absolute right-0 top-full z-50 mt-1 w-48 rounded-2xl border border-zinc-100 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 animate-in fade-in zoom-in-95 duration-100"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => handleRenameClick(attachment)}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                            >
                                                <Edit2 className="h-4 w-4 text-zinc-400" /> Rename
                                            </button>
                                            <button
                                                onClick={() => handleDownload(attachment.id)}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                            >
                                                <Download className="h-4 w-4 text-zinc-400" /> Download
                                            </button>
                                            <div className="my-1 border-t border-zinc-100 dark:border-zinc-900" />
                                            <button
                                                onClick={() => handleDeleteClick(attachment)}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {attachments.length === 0 && !uploadMutation.isPending && (
                    <div className="py-12 text-center rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-100 dark:bg-zinc-800/10 dark:border-zinc-800">
                        <Paperclip className="mx-auto h-8 w-8 text-zinc-300 mb-3" />
                        <p className="text-sm font-medium text-zinc-400">No attachments yet. Add one to get started!</p>
                    </div>
                )}
            </div>

            {/* Rename Modal */}
            {isRenameModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-zinc-900 animate-in zoom-in-95 duration-200">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Rename File</h3>
                            <button onClick={() => setIsRenameModalOpen(false)} className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4 text-sm font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && selectedAttachment && renameMutation.mutate({ id: selectedAttachment.id, name: newName })}
                            autoFocus
                        />
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsRenameModalOpen(false)}
                                className="flex-1 rounded-2xl bg-zinc-100 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => selectedAttachment && renameMutation.mutate({ id: selectedAttachment.id, name: newName })}
                                disabled={renameMutation.isPending || !newName.trim()}
                                className="flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {renameMutation.isPending ? 'Updating...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setSelectedAttachment(null);
                }}
                onConfirm={() => selectedAttachment && deleteMutation.mutate(selectedAttachment.id)}
                title="Delete Attachment"
                message={`Are you sure you want to delete "${selectedAttachment?.originalname || selectedAttachment?.originalName}"? This cannot be undone.`}
                isDanger
                isPending={deleteMutation.isPending}
            />
        </div>
    );
}
