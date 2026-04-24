'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Filter, X, Check, Search, User, Tag, AlertCircle } from 'lucide-react';
import { useBoardContext } from '../../lib/BoardContext';
import { Priority } from '../../lib/types/board';
import { cn } from '../../lib/utils';

export default function BoardFilter() {
    const { board, members, filters, setFilters } = useBoardContext();
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

    const toggleLabel = (labelId: string) => {
        setFilters(prev => ({
            ...prev,
            labelIds: prev.labelIds.includes(labelId)
                ? prev.labelIds.filter(id => id !== labelId)
                : [...prev.labelIds, labelId]
        }));
    };

    const setPriority = (priority: string | null) => {
        setFilters(prev => ({ ...prev, priority: prev.priority === priority ? null : priority }));
    };

    const setAssignee = (userId: string | null) => {
        setFilters(prev => ({ ...prev, assigneeId: prev.assigneeId === userId ? null : userId }));
    };

    const clearFilters = () => {
        setFilters({
            labelIds: [],
            assigneeId: null,
            priority: null,
            searchQuery: filters.searchQuery
        });
    };

    const activeCount = filters.labelIds.length + (filters.assigneeId ? 1 : 0) + (filters.priority ? 1 : 0);

    if (!board) return null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    activeCount > 0
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "bg-white/20 text-white hover:bg-white/30"
                )}
            >
                <Filter className="h-4 w-4" />
                Filter
                {activeCount > 0 && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
                        {activeCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b p-4 dark:border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Filter cards</h3>
                        {activeCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
                        {/* Labels */}
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                <Tag className="h-3 w-3" /> Labels
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {board.labels?.map(label => (
                                    <button
                                        key={label.id}
                                        onClick={() => toggleLabel(label.id)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-full px-3 py-1 text-xs transition-all border",
                                            filters.labelIds.includes(label.id)
                                                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                                                : "bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        {label.name}
                                        {filters.labelIds.includes(label.id) && <Check className="h-3 w-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Members */}
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                <User className="h-3 w-3" /> Assignee
                            </div>
                            <div className="space-y-1">
                                {members.map(member => (
                                    <button
                                        key={member.userId}
                                        onClick={() => setAssignee(member.userId)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
                                            filters.assigneeId === member.userId
                                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white uppercase">
                                                {(member.name || member.userId).charAt(0)}
                                            </div>
                                            {member.name || member.userId}
                                        </span>
                                        {filters.assigneeId === member.userId && <Check className="h-4 w-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                <AlertCircle className="h-3 w-3" /> Priority
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(Priority).map(priority => (
                                    <button
                                        key={priority}
                                        onClick={() => setPriority(priority)}
                                        className={cn(
                                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                                            filters.priority === priority
                                                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900"
                                                : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        {priority}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
