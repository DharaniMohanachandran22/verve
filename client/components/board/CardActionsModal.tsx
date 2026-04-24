'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, ArrowRight, Trash2, Archive, ChevronLeft, CreditCard } from 'lucide-react';
import { useBoardContext } from '../../lib/BoardContext';
import { cn } from '../../lib/utils';

interface CardActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string;
    cardTitle: string;
    onArchive: () => void;
    onDelete: () => void;
    onCopy: (title: string, listId?: string) => void;
    onMove: (targetListId: string) => void;
    anchorRect?: DOMRect | null;
}

type View = 'main' | 'move' | 'copy';

export default function CardActionsModal({
    isOpen,
    onClose,
    cardId,
    cardTitle,
    onArchive,
    onDelete,
    onCopy,
    onMove,
    anchorRect
}: CardActionsModalProps) {
    const { board } = useBoardContext();
    const [view, setView] = useState<View>('main');
    const [titleInput, setTitleInput] = useState(cardTitle);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && anchorRect) {
            const menuWidth = 256; // w-64
            let left = anchorRect.right - menuWidth;
            let top = anchorRect.bottom + 8;

            // Simple viewport collision check
            if (left < 10) left = 10;
            if (top + 300 > window.innerHeight) top = anchorRect.top - 300;

            setPosition({ top, left });
        }
    }, [isOpen, anchorRect]);

    if (!isOpen) return null;

    const handleCopy = () => {
        onCopy(titleInput);
        onClose();
    };

    return (
        <>
            {/* Backdrop to catch clicks outside and exit */}
            <div
                className="fixed inset-0 z-[100] bg-transparent cursor-default"
                onClick={onClose}
            />

            <div
                ref={menuRef}
                style={{
                    position: 'fixed',
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                }}
                onClick={(e) => e.stopPropagation()}
                className="z-[101] w-64 origin-top-right rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-50 dark:border-zinc-800 mb-1">
                    {view !== 'main' ? (
                        <button onClick={() => setView('main')} className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Card Actions</span>
                    )}
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-0.5">
                    {view === 'main' && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setView('move'); }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-500"
                            >
                                <ArrowRight className="h-4 w-4 text-zinc-400" /> Move
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setView('copy'); }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-500"
                            >
                                <Copy className="h-4 w-4 text-zinc-400" /> Copy
                            </button>

                            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                            <button
                                onClick={() => { onArchive(); onClose(); }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                            >
                                <Archive className="h-4 w-4" /> Archive
                            </button>
                            <button
                                onClick={() => { onDelete(); onClose(); }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/10"
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </button>
                        </>
                    )}

                    {view === 'move' && (
                        <div className="max-h-64 overflow-y-auto space-y-0.5 scrollbar-hide py-1">
                            <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">Select List</p>
                            {board?.lists.map(list => (
                                <button
                                    key={list.id}
                                    onClick={() => { onMove(list.id); onClose(); }}
                                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-emerald-900/10"
                                >
                                    <span className="truncate">{list.name}</span>
                                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    )}

                    {view === 'copy' && (
                        <div className="p-3 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Copy title</p>
                            <textarea
                                autoFocus
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                className="w-full rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm font-bold focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50"
                                rows={3}
                            />
                            <button
                                onClick={handleCopy}
                                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-500/20"
                            >
                                Create Copy
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
