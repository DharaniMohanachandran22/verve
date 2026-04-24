'use client';

import React from 'react';
import Modal from './Modal';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    isPending?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDanger = false,
    isPending = false
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
            <div className="flex flex-col items-center text-center py-2">
                <div className={cn(
                    "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg",
                    isDanger
                        ? "bg-red-500 text-white shadow-red-500/20"
                        : "bg-emerald-500 text-white shadow-emerald-500/20"
                )}>
                    <AlertCircle className="h-9 w-9" strokeWidth={2.5} />
                </div>

                <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {title}
                </h3>
                <p className="mb-8 text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-[280px]">
                    {message}
                </p>

                <div className="flex w-full gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-bold text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-95"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className={cn(
                            "flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50",
                            isDanger
                                ? "bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-none"
                                : "btn-primary"
                        )}
                    >
                        {isPending ? 'Processing...' : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
