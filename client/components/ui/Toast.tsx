'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    id: string;
    message: string;
    type: NotificationType;
    onClose: (id: string) => void;
    duration?: number;
}

export default function Toast({ id, message, type, onClose, duration = 5000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, onClose, duration]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    };

    const backgrounds = {
        success: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30',
        error: 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30',
        info: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30',
        warning: 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30',
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 shadow-xl animate-in slide-in-from-right-10 duration-300",
                backgrounds[type]
            )}
            role="alert"
        >
            <div className="shrink-0">{icons[type]}</div>
            <div className="flex-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {message}
            </div>
            <button
                onClick={() => onClose(id)}
                className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-black/5 hover:text-zinc-600 dark:hover:bg-white/5 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
