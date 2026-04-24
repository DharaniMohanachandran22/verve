'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Layout } from 'lucide-react';
import api from '../../lib/api-client';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { cn } from '../../lib/utils';

interface SearchResult {
    id: string;
    title: string;
    description: string;
    listId: string;
}

interface Props {
    boardId: string;
    onCardClick: (cardId: string) => void;
}

export default function BoardSearch({ boardId, onCardClick }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const data = await api.get(`/boards/${boardId}/cards/search?q=${encodeURIComponent(debouncedQuery)}`);
                setResults(data as unknown as SearchResult[]);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery, boardId]);

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
        <div className="relative w-64" ref={containerRef}>
            <div className="group relative">
                <Search className={cn(
                    "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                    (isOpen || query) ? "text-emerald-500" : "text-white/50 group-focus-within:text-white"
                )} />
                <input
                    type="text"
                    placeholder="Search cards..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full rounded-md bg-white/20 py-1.5 pl-9 pr-8 text-sm text-white placeholder-white/60 outline-none transition-all focus:bg-white focus:text-zinc-900 focus:placeholder-zinc-400"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-white/50 hover:bg-black/10 hover:text-white focus:text-zinc-400"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {isOpen && (query.trim() || isLoading) && (
                <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="max-h-96 overflow-y-auto p-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map((card, index) => (
                                    <button
                                        key={`${card.id}-${index}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevent blur/close before click
                                            const id = card.id || (card as any)._id;
                                            if (id) {
                                                onCardClick(id);
                                                setIsOpen(false);
                                                setQuery('');
                                            }
                                        }}
                                        className="flex w-full flex-col gap-0.5 rounded-lg p-3 text-left transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/10 active:scale-[0.98]"
                                    >
                                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{card.title}</span>
                                        <span className="text-xs text-zinc-500 line-clamp-1">{card.description || 'No description'}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-sm text-zinc-500">No cards found matching "{query}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
