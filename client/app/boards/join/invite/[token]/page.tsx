'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../../lib/api-client';
import { useAuth } from '../../../../../contexts/AuthContext';
import { Mail, LogIn, UserPlus, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

type Status = 'loading' | 'preview' | 'accepting' | 'success' | 'error';

interface InvitePreview {
  invitedEmail: string;
  boardName: string;
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<InvitePreview | null>(null);

  // Load invitation preview using plain fetch — no auth interceptors
  useEffect(() => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api';
    fetch(`${baseUrl}/boards/invitations/${token}/preview`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message || 'Invite link expired or invalid');
        return body;
      })
      .then((data: any) => {
        setPreview({ invitedEmail: data.invitedEmail, boardName: data.boardName });
        setStatus('preview');
      })
      .catch((err: any) => {
        setErrorMsg(err.message || 'Invite link expired or invalid');
        setStatus('error');
      });
  }, [token]);

  // Once auth resolves and we have a valid preview, check email match then auto-accept
  useEffect(() => {
    if (authLoading || !user || status !== 'preview' || !preview) return;

    if (user.email.toLowerCase() !== preview.invitedEmail.toLowerCase()) {
      setErrorMsg(
        `This invitation is restricted to ${preview.invitedEmail}. Please sign in with the correct email to continue.`
      );
      setStatus('error');
      return;
    }

    doAccept();
  }, [user, authLoading, status, preview]);

  const doAccept = () => {
    setStatus('accepting');
    api.post(`/boards/invitations/${token}/accept`, {})
      .then((res: any) => {
        setStatus('success');
        setTimeout(() => router.push(`/boards/${res.boardId}`), 1500);
      })
      .catch((err: any) => {
        setErrorMsg(err.message || 'Invite link expired or invalid');
        setStatus('error');
      });
  };

  // Encode redirect with the invited email so login/register can pre-fill it
  const redirectParam = encodeURIComponent(`/boards/join/invite/${token}`);
  const emailParam = preview ? `&email=${encodeURIComponent(preview.invitedEmail)}` : '';

  if (status === 'loading' || authLoading) {
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
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Board Invitation</h1>
          {preview && (
            <p className="mt-2 text-sm font-medium text-emerald-100">
              Join <span className="font-black">"{preview.boardName}"</span>
            </p>
          )}
        </div>

        <div className="p-8">

          {status === 'accepting' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-medium text-zinc-500">Accepting invitation...</p>
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                {errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('invalid')
                  ? <span className="text-2xl">⏰</span>
                  : errorMsg.toLowerCase().includes('already been used')
                    ? <span className="text-2xl">🔒</span>
                    : errorMsg.toLowerCase().includes('cancelled')
                      ? <span className="text-2xl">🚫</span>
                      : <AlertCircle className="h-6 w-6 text-red-500" />}
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">
                  {errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('invalid')
                    ? 'Link Expired or Invalid'
                    : errorMsg.toLowerCase().includes('already been used')
                      ? 'Link Already Used'
                      : errorMsg.toLowerCase().includes('cancelled')
                        ? 'Invitation Cancelled'
                        : 'Wrong Email'}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{errorMsg}</p>
              </div>
              {/* If wrong email and user is logged in, offer to sign out */}
              {errorMsg.toLowerCase().includes('restricted') && user && (
                <p className="text-xs text-zinc-400">
                  Currently signed in as <span className="font-bold">{user.email}</span>.{' '}
                  <Link href={`/login?redirect=${redirectParam}${emailParam}`} className="text-emerald-600 font-bold hover:underline">
                    Sign in with the correct account
                  </Link>
                </p>
              )}
              <button onClick={() => router.push('/boards')} className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-600">
                Go to Boards
              </button>
            </div>
          )}

          {status === 'preview' && !user && preview && (
            <div className="space-y-4">
              {/* Show which email this invite is for */}
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-900/20">
                <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  Invitation sent to{' '}
                  <span className="font-bold text-zinc-900 dark:text-white">{preview.invitedEmail}</span>
                </p>
              </div>
              <p className="text-center text-sm text-zinc-500">
                Sign in or create an account with this email to accept.
              </p>
              <Link
                href={`/login?redirect=${redirectParam}${emailParam}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
              >
                <LogIn className="h-4 w-4" /> Sign in to Accept
              </Link>
              <Link
                href={`/register?redirect=${redirectParam}${emailParam}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-zinc-200 bg-white px-6 py-3.5 text-sm font-black text-zinc-700 hover:border-emerald-300 hover:text-emerald-700 transition-all active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <UserPlus className="h-4 w-4" /> Create an Account
              </Link>
            </div>
          )}

          {status === 'preview' && user && preview && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-zinc-500">
                Signed in as <span className="font-bold text-zinc-900 dark:text-white">{user.email}</span>
              </p>
              <button
                onClick={doAccept}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
              >
                Accept Invitation <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
