'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    label?: string;
    fullPage?: boolean;
}

export default function LoadingSpinner({
    size = 'md',
    className,
    label,
    fullPage = false,
}: Props) {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-10 w-10 border-3',
        xl: 'h-16 w-16 border-4',
    };

    const container = fullPage
        ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80"
        : "flex flex-col items-center justify-center py-8";

    return (
        <div className={cn(container, className)}>
            <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
            {label && <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>}
        </div>
    );
}
