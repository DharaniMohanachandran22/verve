'use client';

import { useState } from 'react';
import { X, User, Check, Search } from 'lucide-react';
import { MemberResponse } from '../../lib/types/board';
import { cn } from '../../lib/utils';

interface Props {
    members: MemberResponse[];
    selectedId?: string | null;
    onSelect: (userId: string | null) => void;
    onClose: () => void;
}

export default function AssigneePicker({ members, selectedId, onSelect, onClose }: Props) {
    const [search, setSearch] = useState('');

    const filtered = members.filter(m =>
        (m.name || m.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="absolute right-0 top-full z-[70] mt-2 w-64 rounded-2xl border border-zinc-100 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Members</span>
                <button onClick={onClose} className="rounded-lg p-1 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <X className="h-3 w-3 text-zinc-400" />
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
                <input
                    autoFocus
                    type="text"
                    placeholder="Search members..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2 pl-8 pr-3 text-xs font-medium focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800"
                />
            </div>

            <div className="max-h-60 space-y-0.5 overflow-y-auto pr-1">
                {/* No assignee option */}
                <button
                    onClick={() => onSelect(null)}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-xs font-bold transition-all",
                        !selectedId
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                            : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    )}
                >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                        <User className="h-4 w-4" />
                    </div>
                    <span>No Assignee</span>
                    {!selectedId && <Check className="ml-auto h-3 w-3" />}
                </button>

                {filtered.map((member) => (
                    <button
                        key={member.userId}
                        onClick={() => onSelect(member.userId)}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-xs font-bold transition-all",
                            selectedId === member.userId
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                                : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        )}
                    >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-[10px] font-black text-white uppercase">
                            {(member.name || member.email || 'U').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate">{member.name || member.email}</p>
                            <p className="text-[9px] font-medium opacity-50 capitalize">{member.role}</p>
                        </div>
                        {selectedId === member.userId && <Check className="ml-auto h-3 w-3 shrink-0" />}
                    </button>
                ))}

                {filtered.length === 0 && (
                    <p className="py-3 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        No members found
                    </p>
                )}
            </div>
        </div>
    );
}
