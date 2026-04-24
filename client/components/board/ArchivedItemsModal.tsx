'use client';

import React, { useState, useEffect } from 'react';
import { Archive, X, RotateCcw, Loader2, Package, LayoutList, CreditCard } from 'lucide-react';
import api from '../../lib/api-client';
import { CardDetail, ListDetail } from '../../lib/types/board';
import { cn } from '../../lib/utils';
import { useBoardContext } from '../../lib/BoardContext';

interface Props {
    boardId: string;
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'cards' | 'lists';

export default function ArchivedItemsModal({ boardId, isOpen, onClose }: Props) {
    const [archivedCards, setArchivedCards] = useState<CardDetail[]>([]);
    const [archivedLists, setArchivedLists] = useState<ListDetail[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('cards');
    const { refresh } = useBoardContext();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cardsData, listsData] = await Promise.all([
                api.get(`/boards/${boardId}/cards/archived`),
                api.get(`/boards/${boardId}/lists/archived`)
            ]);
            setArchivedCards(cardsData as unknown as CardDetail[]);
            setArchivedLists(listsData as unknown as ListDetail[]);
        } catch (err) {
            console.error('Failed to fetch archived items:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen, boardId]);

    const handleRestoreCard = async (cardId: string) => {
        try {
            await api.post(`/cards/${cardId}/restore`);
            setArchivedCards(prev => prev.filter(c => c.id !== cardId));
            refresh();
        } catch (err) {
            alert('Failed to restore card');
        }
    };

    const handleRestoreList = async (listId: string) => {
        try {
            await api.post(`/lists/${listId}/restore`);
            setArchivedLists(prev => prev.filter(l => l.id !== listId));
            refresh();
        } catch (err) {
            alert('Failed to restore list');
        }
    };

    if (!isOpen) return null;

    const items = activeTab === 'cards' ? archivedCards : archivedLists;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-huge dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between border-b p-6 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                            <Archive className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-bold font-serif text-zinc-900 dark:text-white">Archived Items</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all dark:hover:bg-zinc-800 dark:hover:text-white active:scale-90"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="bg-zinc-50/50 dark:bg-zinc-800/30 px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 flex gap-4">
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95",
                            activeTab === 'cards'
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                                : "text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200"
                        )}
                    >
                        <CreditCard className="h-3.5 w-3.5" />
                        Cards
                    </button>
                    <button
                        onClick={() => setActiveTab('lists')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95",
                            activeTab === 'lists'
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                                : "text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200"
                        )}
                    >
                        <LayoutList className="h-3.5 w-3.5" />
                        Lists
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            <p className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Gathering archived items...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                            <Package className="mb-4 h-12 w-12 opacity-10" />
                            <p className="text-sm font-bold opacity-40 capitalize">No archived {activeTab} in this board.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/30 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/30 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:border-emerald-900/40"
                                >
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                            {activeTab === 'cards' ? item.title : item.name}
                                        </h4>
                                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                            Archived on {new Date(item.updatedAt || '').toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => activeTab === 'cards' ? handleRestoreCard(item.id) : handleRestoreList(item.id)}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white shadow-sm active:scale-90"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t p-6 bg-zinc-50 dark:bg-zinc-900/50 dark:border-zinc-800 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Archived items can be restored to their original location.
                    </p>
                </div>
            </div>
        </div>
    );
}
