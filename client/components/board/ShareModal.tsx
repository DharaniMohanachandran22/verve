'use client';

import { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, Trash2, ChevronDown, Mail, Users, Clock, Send } from 'lucide-react';
import api from '../../lib/api-client';
import { useBoardContext } from '../../lib/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { cn } from '../../lib/utils';
import type { Role } from '../../lib/types/board';

interface Props {
  boardId: string;
  onClose: () => void;
}

type ShareRole = 'editor' | 'viewer';
type Tab = 'members' | 'pending';

interface ShareInfo { token: string | null; shareRole: ShareRole; }
interface PendingInvite { email: string; role: Role; token: string; expiresAt: string; }

const ROLE_LABELS: Record<string, string> = { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' };

export default function ShareModal({ boardId, onClose }: Props) {
  const { members, refresh, currentUserRole } = useBoardContext();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const isOwner = currentUserRole === 'owner';

  const [tab, setTab] = useState<Tab>('members');
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [shareLoading, setShareLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [selectedShareRole, setSelectedShareRole] = useState<ShareRole>('viewer');

  // Email invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('editor');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) { setEmailError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) { setEmailError('Enter a valid email address'); return false; }
    setEmailError('');
    return true;
  };

  const [inviteRoleOpen, setInviteRoleOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  useEffect(() => {
    api.get(`/boards/${boardId}/share`)
      .then((data: any) => { setShareInfo(data); if (data.shareRole) setSelectedShareRole(data.shareRole); })
      .catch(() => setShareInfo({ token: null, shareRole: 'viewer' }))
      .finally(() => setShareLoading(false));
  }, [boardId]);

  useEffect(() => {
    if (!isOwner) return;
    setPendingLoading(true);
    api.get(`/boards/${boardId}/invitations`)
      .then((data: any) => setPendingInvites(data || []))
      .catch(() => setPendingInvites([]))
      .finally(() => setPendingLoading(false));
  }, [boardId, isOwner]);

  const shareUrl = shareInfo?.token ? `${window.location.origin}/boards/join/${shareInfo.token}` : null;

  const handleGenerateLink = async (role: ShareRole = selectedShareRole) => {
    setShareLoading(true);
    try {
      const data: any = await api.post(`/boards/${boardId}/share`, { role });
      setShareInfo({ token: data.token, shareRole: data.shareRole });
      setSelectedShareRole(data.shareRole);
    } finally { setShareLoading(false); }
  };

  const handleDeleteLink = async () => {
    setShareLoading(true);
    try {
      await api.delete(`/boards/${boardId}/share`);
      setShareInfo({ token: null, shareRole: selectedShareRole });
    } finally { setShareLoading(false); }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (role: ShareRole) => {
    setSelectedShareRole(role);
    setRoleDropdownOpen(false);
    if (shareInfo?.token) await handleGenerateLink(role);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(inviteEmail)) return;
    setInviteLoading(true);
    try {
      await api.post(`/boards/${boardId}/members`, { email: inviteEmail.trim(), role: inviteRole });
      showNotification(`Invitation sent to ${inviteEmail}`, 'success');
      setInviteEmail('');
      setEmailError('');
      // Refresh pending list
      const data: any = await api.get(`/boards/${boardId}/invitations`);
      setPendingInvites(data || []);
    } catch (err: any) {
      showNotification(err.message || 'Failed to send invitation', 'error');
    } finally { setInviteLoading(false); }
  };

  const handleCancelInvite = async (token: string) => {
    try {
      await api.delete(`/boards/${boardId}/invitations/${token}`);
      setPendingInvites(prev => prev.filter(i => i.token !== token));
    } catch {
      showNotification('Failed to cancel invitation', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-zinc-900 border border-emerald-500/10 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b p-6 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Link2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Collaborate</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Email invite */}
          {isOwner && (
            <form onSubmit={handleInvite} className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Invite by email</p>
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="text"
                    placeholder="Enter email address..."
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                    onBlur={e => e.target.value && validateEmail(e.target.value)}
                    className={cn(
                      "w-full rounded-xl border bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:bg-zinc-800 dark:text-white",
                      emailError
                        ? "border-red-400 focus:border-red-500"
                        : "border-zinc-200 focus:border-emerald-500 dark:border-zinc-700"
                    )}
                  />
                  {emailError && (
                    <p className="text-xs font-medium text-red-500 px-1">{emailError}</p>
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setInviteRoleOpen(!inviteRoleOpen)}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    {ROLE_LABELS[inviteRole]}
                    <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform", inviteRoleOpen && "rotate-180")} />
                  </button>
                  {inviteRoleOpen && (
                    <div className="absolute right-0 top-full mt-1 w-32 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-800 z-20">
                      {(['editor', 'viewer'] as Role[]).map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setInviteRole(r); setInviteRoleOpen(false); }}
                          className={cn(
                            "flex w-full items-center px-4 py-2.5 text-sm font-bold transition-colors",
                            inviteRole === r
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                              : "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-emerald-900/20"
                          )}
                        >
                          {ROLE_LABELS[r]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-all"
                >
                  <Send className="h-4 w-4" />
                  {inviteLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          )}

          {/* Share link */}
          <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/30 p-5 dark:border-emerald-900/20 dark:bg-emerald-900/5">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-400">Share via link</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 min-w-0">
                {shareInfo?.token ? (
                  <>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      Anyone with the link joins as <span className="text-emerald-600">{ROLE_LABELS[shareInfo.shareRole]}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <button onClick={handleCopy} className="flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700">
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied!' : 'Copy link'}
                      </button>
                      <span className="h-1 w-1 rounded-full bg-zinc-300" />
                      <button onClick={handleDeleteLink} disabled={shareLoading} className="flex items-center gap-1.5 font-bold text-red-500 hover:text-red-600 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" /> Delete link
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-zinc-400 italic">No share link active</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-700 hover:border-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {ROLE_LABELS[selectedShareRole]}
                      <ChevronDown className={cn("h-4 w-4 transition-transform", roleDropdownOpen && "rotate-180")} />
                    </button>
                    {roleDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-32 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-800 z-20">
                        {(['viewer', 'editor'] as ShareRole[]).map(r => (
                          <button key={r} onClick={() => handleRoleChange(r)} className="flex w-full px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-emerald-900/20">
                            {ROLE_LABELS[r]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!shareInfo?.token && isOwner && (
                  <button onClick={() => handleGenerateLink()} disabled={shareLoading} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
                    {shareLoading ? 'Creating...' : 'Create link'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs: Board Members / Pending Invites */}
          <div>
            <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <button
                onClick={() => setTab('members')}
                className={cn("flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-px",
                  tab === 'members' ? "border-emerald-500 text-emerald-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
                )}
              >
                <Users className="h-3.5 w-3.5" />
                Board Members
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-600">{members.length}</span>
              </button>
              {isOwner && (
                <button
                  onClick={() => setTab('pending')}
                  className={cn("flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-px",
                    tab === 'pending' ? "border-emerald-500 text-emerald-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Pending Invites
                  {pendingInvites.length > 0 && (
                    <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600">{pendingInvites.length}</span>
                  )}
                </button>
              )}
            </div>

            {tab === 'members' && (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {members.map(m => (
                  <div key={m.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-black text-white uppercase shadow-sm">
                        {(m.name || m.email || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {m.name || m.email}
                          {m.userId === user?.id && <span className="ml-1 text-xs font-medium text-zinc-400">(you)</span>}
                        </p>
                        <p className="text-xs text-zinc-400">{m.email}</p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:bg-zinc-800">
                      {ROLE_LABELS[m.role]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'pending' && (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {pendingLoading && (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  </div>
                )}
                {!pendingLoading && pendingInvites.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-zinc-400">
                    <Mail className="mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">No pending invitations</p>
                  </div>
                )}
                {pendingInvites.map(invite => (
                  <div key={invite.token} className="flex items-center justify-between rounded-xl bg-amber-50/50 px-4 py-3 dark:bg-amber-900/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{invite.email}</p>
                        <p className="text-xs text-zinc-400">
                          Invited as {ROLE_LABELS[invite.role]} · expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(invite.token)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors dark:hover:bg-red-900/20"
                      title="Cancel invitation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
