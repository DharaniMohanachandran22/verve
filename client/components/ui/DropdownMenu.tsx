'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface DropdownItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    className?: string;
    variant?: 'default' | 'danger';
}

interface Props {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
    className?: string;
    triggerClassName?: string;
}

export default function DropdownMenu({
    trigger,
    items,
    align = 'right',
    className,
    triggerClassName,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("relative inline-block", className)} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn("cursor-pointer", triggerClassName)}
            >
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150",
                        align === 'right' ? 'right-0' : 'left-0'
                    )}
                >
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                item.onClick();
                                setIsOpen(false);
                            }}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                                item.variant === 'danger'
                                    ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                                item.className
                            )}
                        >
                            {item.icon && <span className="h-4 w-4 opacity-70">{item.icon}</span>}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
