'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { BoardProvider, useBoardContext } from '../../../lib/BoardContext';
import Board from '../../../components/board/Board';
import MembersPanel from '../../../components/board/MembersPanel';
import Navbar from '../../../components/layout/Navbar';
import BoardSearch from '../../../components/board/BoardSearch';
import BoardFilter from '../../../components/board/BoardFilter';
import CardModal from '../../../components/board/CardModal';
import ArchivedItemsModal from '../../../components/board/ArchivedItemsModal';
import { Users, ArrowLeft, Trash2, Archive, Share2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ShareModal from '../../../components/board/ShareModal';

function BoardDetailContent() {
  const { boardId } = useParams<{ boardId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { board, loading, error, currentUserRole } = useBoardContext();
  const isOwner = currentUserRole === 'owner';
  const [showMembers, setShowMembers] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeCardId, setActiveCardId] = useState<string | null>(searchParams.get('cardId'));

  // Sync state with URL changes (back button etc)
  useEffect(() => {
    setActiveCardId(searchParams.get('cardId'));
  }, [searchParams]);

  if (!mounted) return null;

  const handleOpenCard = (id: string) => {
    setActiveCardId(id);
    const params = new URLSearchParams(window.location.search);
    params.set('cardId', id);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleCloseCard = () => {
    setActiveCardId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('cardId');
    const newQuery = params.toString();
    router.push(newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname);
  };

  if (loading && !board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background noise">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl">
            <Sparkles className="h-10 w-10 animate-pulse text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background noise p-6 text-center">
        <div className="mb-8 rounded-3xl bg-danger/10 p-6">
          <Trash2 className="h-12 w-12 text-danger" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Something went wrong</h2>
        <p className="mt-2 text-secondary text-lg max-w-md font-medium">{error}</p>
        <Link href="/dashboard" className="mt-8 inline-flex items-center gap-2 font-bold text-primary hover:text-primary/80 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Return to sanctuary
        </Link>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="relative flex h-screen flex-col bg-background noise overflow-hidden">
      <Navbar />
      {/* Board Header */}
      <header className="flex h-16 items-center justify-between border-b border-primary/20 bg-primary-dark/95 backdrop-blur-md px-4 lg:px-8 shadow-xl z-40 transition-luxury">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-luxury hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Dashboard</span>
          </Link>
          <div className="h-6 w-[1px] bg-white/10" />
          <h1 className="font-serif text-xl font-bold tracking-tight text-white drop-shadow-sm">{board.name}</h1>

          <div className="ml-4 flex items-center gap-2.5">
            <BoardSearch
              boardId={boardId}
              onCardClick={handleOpenCard}
            />
            <button
              onClick={() => setShowArchived(true)}
              className="rounded-lg bg-white/10 p-2 text-white transition-luxury hover:bg-white/20 hover:scale-110 active:scale-90"
              title="Archived Items"
            >
              <Archive className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BoardFilter />
          {isOwner && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-xs font-bold text-primary-dark shadow-lg transition-luxury hover:scale-105 hover:bg-white/95 active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              Collaborate
            </button>
          )}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold shadow-lg transition-luxury hover:scale-105 active:scale-95",
              showMembers
                ? "bg-white text-primary-dark border-transparent"
                : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Workspace
          </button>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <Board />

        {/* Side Panels */}
        {showMembers && (
          <aside className="absolute bottom-4 right-4 top-4 w-[320px] overflow-hidden rounded-[2rem] border border-primary/20 bg-white/95 shadow-huge backdrop-blur-2xl z-50 transition-luxury dark:bg-zinc-900/95 dark:border-zinc-800">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-5">
              <div>
                <h2 className="font-serif text-lg font-bold text-zinc-900 dark:text-white">Workspace</h2>
                <p className="mt-0.5 text-xs font-medium text-zinc-400 italic">Manage your collective</p>
              </div>
              <button
                onClick={() => setShowMembers(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100%-72px)]">
              <MembersPanel boardId={boardId} />
            </div>
          </aside>
        )}
      </main>

      {/* Overlays */}
      {activeCardId && activeCardId !== 'undefined' && (
        <CardModal
          key={activeCardId}
          cardId={activeCardId}
          onClose={handleCloseCard}
        />
      )}

      <ArchivedItemsModal
        boardId={boardId}
        isOpen={showArchived}
        onClose={() => setShowArchived(false)}
      />

      {showShare && (
        <ShareModal
          boardId={boardId}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

// Utility function (duplicated here to avoid import issues for now)
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function BoardDetailPage() {
  return (
    <BoardProvider>
      <React.Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-background noise">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl">
              <Sparkles className="h-10 w-10 animate-pulse text-primary" />
            </div>
          </div>
        </div>
      }>
        <BoardDetailContent />
      </React.Suspense>
    </BoardProvider>
  );
}
