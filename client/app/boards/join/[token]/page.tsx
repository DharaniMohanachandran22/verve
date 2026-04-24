'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../lib/api-client';
import { useAuth } from '../../../../contexts/AuthContext';
import { Users, LogIn, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';

type Status = 'preview' | 'joining' | 'success' | 'error';
interface BoardPreview { name: string; role: string; }

export default function JoinBoardPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<Status>('preview');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<BoardPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    api.get(`/boards/join/${token}/preview`)
      .then((data: any) => setPreview(data))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [token]);

  // Auto-join once authenticated and preview loaded
  useEffect(() => {
    if (authLoading || !user || status !== 'preview' || previewLoading) return;
    doJoin();
  }, [user, authLoading, previewLoading, status]);

  const doJoin = () => {
    setStatus('joining');
    api.post(`/boards/join/${token}`, {})
      .then((data: any) => { setStatus('success'); setTimeout(() => router.push(`/boards/${data.boardId}`), 1500); })
      .catch((err: any) => { setStatus('error'); setErrorMsg(err.message || 'Invalid or expired link'); });
  };

  const redirectParam = encodeURIComponent(`/boards/join/${token}`);

  if (previewLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900">

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {preview ? `Join "${preview.name}"` : 'Board Invitation'}
          </h1>
          {preview && (
            <p className="mt-2 text-sm font-medium text-emerald-100">
              You'll join as <span className="font-black capitalize">{preview.role}</span>
            </p>
          )}
        </div>

        <div className="p-8">
          {status === 'joining' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-medium text-zinc-500">Joining board...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <p className="font-bold text-zinc-900 dark:text-white">You've joined the board!</p>
              <p className="text-xs text-zinc-400">Redirecting you now...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">✕</div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Failed to join</p>
                <p className="mt-1 text-sm text-zinc-500">{errorMsg}</p>
              </div>
              <button onClick={() => router.push('/dashboard')} className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-600">
                Go to Dashboard
              </button>
            </div>
          )}

          {status === 'preview' && !user && (
            <div className="space-y-4">
              <p className="text-center text-sm text-zinc-500">Sign in or create an account to join this board.</p>
              <Link
                href={`/login?redirect=${redirectParam}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
              >
                <LogIn className="h-4 w-4" /> Sign in to Join
              </Link>
              <Link
                href={`/register?redirect=${redirectParam}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-zinc-200 bg-white px-6 py-3.5 text-sm font-black text-zinc-700 hover:border-emerald-300 hover:text-emerald-700 transition-all active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <UserPlus className="h-4 w-4" /> Create an Account
              </Link>
            </div>
          )}

          {status === 'preview' && user && preview && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-zinc-500">
                Signed in as <span className="font-bold text-zinc-900 dark:text-white">{user.name}</span>
              </p>
              <button
                onClick={doJoin}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
              >
                Join Board <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {!preview && status === 'preview' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <p className="text-sm text-zinc-500">This invite link is invalid or has expired.</p>
              <Link href="/dashboard" className="rounded-xl bg-zinc-100 px-6 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
