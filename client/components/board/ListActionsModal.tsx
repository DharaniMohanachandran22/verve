'use client';

import React, { useState } from 'react';
import { X, Plus, Copy, ArrowRight, ChevronDown, ListFilter, Eye, Check, ChevronLeft, Layout, Archive, Trash2 } from 'lucide-react';
import { useBoardContext } from '../../lib/BoardContext';
import { cn } from '../../lib/utils';

interface ListActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    listId: string;
    listName: string;
    onAddCard: () => void;
    onArchive: () => void;
    onCopy: (name: string) => void;
    onMoveAllCards: (targetListId: string) => void;
    onSort: (sortBy: 'newest' | 'oldest' | 'name') => void;
    onDelete: () => void;
}

type View = 'main' | 'copy' | 'move' | 'move-all-cards' | 'sort';

export default function ListActionsModal({
    isOpen,
    onClose,
    listId,
    listName,
    onAddCard,
    onArchive,
    onCopy,
    onMoveAllCards,
    onSort,
    onDelete,
}: ListActionsModalProps) {
    const { board } = useBoardContext();
    const [view, setView] = useState<View>('main');
    const [copyName, setCopyName] = useState(listName);

    if (!isOpen) return null;

    const otherLists = board?.lists.filter(l => l.id !== listId) || [];

    const handleBack = () => setView('main');

    const renderMain = () => (
        <>
            <div className="mb-2 flex items-center justify-between px-3 pt-2">
                <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest text-[10px]">List actions</span>
                <button
                    onClick={onClose}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-0.5">
                <button
                    onClick={() => { onAddCard(); onClose(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:text-zinc-400 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-500"
                >
                    <Plus className="h-4 w-4 text-emerald-500" /> Add card
                </button>
                <button
                    onClick={() => setView('copy')}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:text-zinc-400 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-500"
                >
                    <Copy className="h-4 w-4 text-emerald-500" /> Copy list
                </button>
                <button
                    onClick={() => setView('move-all-cards')}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:text-zinc-400 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-500"
                >
                    <div className="flex items-center gap-3">
                        <ChevronDown className="h-4 w-4 text-emerald-500" /> Move all cards in this list
                    </div>
                </button>
                <button
                    onClick={() => setView('sort')}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 dark:text-zinc-400 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-500"
                >
                    <div className="flex items-center gap-3">
                        <ListFilter className="h-4 w-4 text-emerald-500" /> Sort by...
                    </div>
                </button>

            </div>

            <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                <button
                    onClick={() => { onArchive(); onClose(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-50 active:scale-95 dark:hover:bg-emerald-900/10"
                >
                    <Archive className="h-4 w-4" /> Archive this list
                </button>
                <button
                    onClick={() => { onDelete(); onClose(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-all hover:bg-red-50 active:scale-95 dark:hover:bg-red-900/10"
                >
                    <Trash2 className="h-4 w-4" /> Delete this list
                </button>
            </div>
        </>
    );

    const renderCopy = () => (
        <>
            <div className="mb-2 flex items-center justify-between px-1 pt-2">
                <button onClick={handleBack} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-zinc-500">Copy list</span>
                <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="p-1 space-y-4">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        <Layout className="h-3.5 w-3.5 text-emerald-500" />
                        Name
                    </label>
                    <textarea
                        autoFocus
                        className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-white resize-none"
                        value={copyName}
                        onChange={(e) => setCopyName(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        rows={2}
                    />
                </div>
                <button
                    onClick={() => { onCopy(copyName); onClose(); }}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all"
                >
                    Create list
                </button>
            </div>
        </>
    );

    const renderSort = () => (
        <>
            <div className="mb-2 flex items-center justify-between px-1 pt-2">
                <button onClick={handleBack} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-zinc-500">Sort list</span>
                <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="space-y-0.5">
                {[
                    { id: 'newest', label: 'Newest first' },
                    { id: 'oldest', label: 'Oldest first' },
                    { id: 'name', label: 'Card name (A-Z)' },
                ].map((option) => (
                    <button
                        key={option.id}
                        onClick={() => { onSort(option.id as any); onClose(); }}
                        className="flex w-full px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl dark:text-zinc-400 dark:hover:bg-emerald-900/10"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </>
    );

    const renderMoveAll = () => (
        <>
            <div className="mb-2 flex items-center justify-between px-1 pt-2">
                <button onClick={handleBack} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-zinc-500">Select target list</span>
                <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-hide">
                {otherLists.length === 0 ? (
                    <div className="px-3 py-8 text-center text-xs font-bold text-zinc-400">No other lists available</div>
                ) : (
                    otherLists.map((list) => (
                        <button
                            key={list.id}
                            onClick={() => { onMoveAllCards(list.id); onClose(); }}
                            className="flex w-full px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl text-left dark:text-zinc-400 dark:hover:bg-emerald-900/10"
                        >
                            {list.name}
                        </button>
                    ))
                )}
            </div>
        </>
    );

    return (
        <div className="absolute top-10 right-0 z-50 w-72 origin-top-right rounded-2xl bg-white p-3 shadow-2xl border border-zinc-100 animate-in fade-in zoom-in duration-200 dark:bg-zinc-900 dark:border-zinc-800 pb-4">
            {view === 'main' && renderMain()}
            {view === 'copy' && renderCopy()}
            {view === 'sort' && renderSort()}
            {view === 'move-all-cards' && renderMoveAll()}
        </div>
    );
}
