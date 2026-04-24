'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    message: string;
    onRetry?: () => void;
    className?: string;
    variant?: 'inline' | 'full';
}

export default function ErrorMessage({
    message,
    onRetry,
    className,
    variant = 'full',
}: Props) {
    const container = variant === 'full'
        ? "flex flex-col items-center justify-center py-16 text-center"
        : "inline-flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-900/10 dark:text-red-400 border border-red-100 dark:border-red-900/20";

    return (
        <div className={cn(container, className)}>
            <AlertCircle className={cn("h-8 w-8 text-red-500", variant === 'inline' && "h-5 w-5")} />
            <div className={cn(variant === 'full' && "mt-4")}>
                <p className="text-sm font-medium">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className={cn(
                            "mt-4 flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-md",
                            variant === 'inline' && "mt-2 px-3 py-1 bg-transparent text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 shadow-none border border-red-200 dark:border-red-800"
                        )}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </button>
                )}
            </div>
        </div>
    );
}
