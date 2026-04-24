'use client';

import { useState } from 'react';
import { updateMemberRole } from '../../lib/api/boards';
import type { MemberResponse, Role } from '../../lib/types/board';
import { X, Shield } from 'lucide-react';

interface Props {
  boardId: string;
  member: MemberResponse;
  isCurrentUser: boolean;
  allMembers: MemberResponse[];
  onClose: () => void;
  onUpdated: () => void;
}

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'viewer', label: 'Viewer', desc: 'Can view cards and lists' },
  { value: 'editor', label: 'Editor', desc: 'Can create and edit cards' },
  { value: 'owner',  label: 'Owner',  desc: 'Full control of the board' },
];

export default function UpdateRoleModal({ boardId, member, isCurrentUser, allMembers, onClose, onUpdated }: Props) {
  const [role, setRole] = useState<Role>(member.role);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsNewOwner = isCurrentUser && role !== 'owner';
  const otherMembers = allMembers.filter((m) => m.userId !== member.userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateMemberRole(boardId, member.userId, role, needsNewOwner ? newOwnerId : undefined);
      onUpdated();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Change Role</p>
              <p className="text-[11px] text-zinc-400">{member.name || member.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Role selector */}
          <div className="space-y-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                  role === r.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-zinc-100 hover:border-zinc-200 dark:border-zinc-800 dark:hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="accent-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{r.label}</p>
                  <p className="text-[11px] text-zinc-400">{r.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Transfer ownership */}
          {needsNewOwner && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Transfer ownership to
              </label>
              <select
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">Select member…</option>
                {otherMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.name || m.email}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
