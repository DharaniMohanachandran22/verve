'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export default function EmptyState({
    icon = <Package className="h-12 w-12" />,
    title,
    description,
    action,
    className,
}: Props) {
    return (
        <div className={cn("flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-100 p-12 text-center dark:border-zinc-800", className)}>
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 animate-in zoom-in-95 duration-300">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white capitalize">{title}</h3>
            {description && (
                <p className="mt-2 max-w-[280px] text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
            )}
            {action && <div className="mt-8">{action}</div>}
        </div>
    );
}
