'use client';

import React, { useRef, useState } from 'react';
import Modal from '../ui/Modal';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api-client';
import { Paperclip, Upload, X, FileText, File, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AttachmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string;
    onUploaded: () => void;
}

export default function AttachmentModal({ isOpen, onClose, cardId, onUploaded }: AttachmentModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const mutation = useMutation({
        mutationFn: (formData: FormData) =>
            api.post(`/cards/${cardId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }),
        onSuccess: () => {
            setFile(null);
            onUploaded();
            onClose();
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) setFile(selectedFile);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        mutation.mutate(formData);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimetype: string) => {
        if (mimetype.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-emerald-500" />;
        if (mimetype === 'application/pdf') return <FileText className="h-8 w-8 text-emerald-500" />;
        return <File className="h-8 w-8 text-emerald-500" />;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload Attachment" size="sm">
            <div className="mb-4 text-center">
                <p className="text-sm font-medium text-secondary">
                    Add supporting documents or images to this card.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {!file ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-slate-50 p-10 transition-all hover:border-primary hover:bg-emerald-50 cursor-pointer"
                    >
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 group-hover:bg-emerald-100 transition-colors">
                            <Upload className="h-6 w-6 text-zinc-400 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="mb-1 text-sm font-bold text-zinc-900 group-hover:text-zinc-950">Click or drag to upload</p>
                        <p className="text-xs font-medium text-zinc-500">Support for PDF, DOC, images (max 10MB)</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 rounded-xl border border-primary bg-emerald-50/50 p-4 relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                            {getFileIcon(file.type)}
                        </div>
                        <div className="flex flex-1 flex-col truncate pr-6">
                            <span className="truncate text-sm font-bold text-emerald-950">{file.name}</span>
                            <span className="text-xs font-medium text-emerald-700">{formatSize(file.size)}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="absolute top-2 right-2 rounded-full p-1 text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div className="flex gap-4 pt-4 border-t dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-bold text-zinc-500 transition-all hover:bg-zinc-50 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending || !file}
                        className="btn-primary flex-1 shadow-lg active:scale-95 shadow-primary/20 transition-all"
                    >
                        {mutation.isPending ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
