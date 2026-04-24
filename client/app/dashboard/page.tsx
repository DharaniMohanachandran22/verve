'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api-client';
import { Plus, Layout, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateBoardModal from '../../components/CreateBoardModal';
import Navbar from '../../components/layout/Navbar';
import { cn } from '../../lib/utils';

interface Board {
    id: string;
    name: string;
    role: string;
}

export default function Dashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: boards, isLoading: boardsLoading } = useQuery<Board[]>({
        queryKey: ['boards'],
        queryFn: () => api.get('/boards'),
        enabled: !!user,
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    if (authLoading || boardsLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background noise">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl">
                        <Sparkles className="h-8 w-8 animate-pulse text-primary" />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background text-foreground noise">
            <Navbar />

            <main className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
                <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/10">
                            <Layout className="h-3 w-3" />
                            <span>Workspace Overview</span>
                        </div>
                        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Your Boards</h1>
                        <p className="text-base text-secondary font-medium">Curate your projects and orchestrate your vision.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-luxury hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/40 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Create New Board
                    </button>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {boards?.map((board) => (
                        <Link
                            key={board.id}
                            href={`/boards/${board.id}`}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-border bg-white p-6 transition-luxury hover-lift hover:border-primary/30"
                        >
                            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/5 transition-luxury group-hover:scale-150 group-hover:bg-primary/10" />

                            <div className="relative">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                                        board.role === 'ADMIN'
                                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    )}>
                                        {board.role.toLowerCase()}
                                    </div>
                                </div>
                                <h3 className="font-serif text-xl font-bold transition-colors group-hover:text-primary leading-tight">
                                    {board.name}
                                </h3>
                            </div>

                            <div className="relative mt-8 flex items-center justify-between border-t border-border pt-4">
                                <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors italic">Enter Board</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary transition-luxury group-hover:bg-primary group-hover:text-white group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-primary/30">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                            </div>
                        </Link>
                    ))}

                    {boards?.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 py-24 text-center glass">
                            <div className="mb-4 rounded-2xl bg-white p-5 shadow-lg shadow-primary/5">
                                <Layout className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-foreground">A clean slate awaits</h3>
                            <p className="mt-2 text-secondary text-base max-w-sm font-medium">Create your first board to start managing projects with elegance and clarity.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-8 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-luxury hover:scale-105 hover:bg-primary/90"
                            >
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <CreateBoardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
