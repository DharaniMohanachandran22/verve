'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeMember } from '../../lib/api/boards';
import { useBoardContext } from '../../lib/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import type { MemberResponse } from '../../lib/types/board';
import UpdateRoleModal from './UpdateRoleModal';
import { Shield, Trash2, Pencil, LogOut, AlertTriangle } from 'lucide-react';

interface Props { boardId: string; }

const ROLE_STYLES: Record<string, { label: string; cls: string }> = {
  owner:  { label: 'Owner',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  editor: { label: 'Editor', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  viewer: { label: 'Viewer', cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
};

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{message}</p>
        </div>
        <div className="flex border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <div className="w-px bg-zinc-100 dark:bg-zinc-800" />
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MembersPanel({ boardId }: Props) {
  const { members, currentUserRole, refresh } = useBoardContext();
  const { user } = useAuth();
  const router = useRouter();
  const [editingMember, setEditingMember] = useState<MemberResponse | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<MemberResponse | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const isOwner = currentUserRole === 'owner';

  const handleRemoveConfirmed = async () => {
    if (!confirmRemove) return;
    const target = confirmRemove;
    setConfirmRemove(null);
    setRemoving(target.userId);
    try {
      await removeMember(boardId, target.userId);
      if (target.userId === user?.id) {
        router.replace('/boards');
      } else {
        refresh();
      }
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {members.map((m) => {
          const isSelf = m.userId === user?.id;
          const style = ROLE_STYLES[m.role] ?? ROLE_STYLES.viewer;
          const isRemoving = removing === m.userId;

          return (
            <li
              key={m.userId}
              className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-black text-white uppercase shadow-sm">
                  {(m.name || m.email || '?').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                    {m.name || m.email}
                    {isSelf && <span className="ml-1.5 text-[10px] font-medium text-zinc-400">(you)</span>}
                  </p>
                  {m.name && <p className="truncate text-[11px] text-zinc-400">{m.email}</p>}
                </div>
              </div>

              {/* Role + actions */}
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${style.cls}`}>
                  {style.label}
                </span>

                {isOwner && !isSelf && (
                  <button
                    onClick={() => setEditingMember(m)}
                    title="Change role"
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}

                {(isOwner && !isSelf) || isSelf ? (
                  <button
                    onClick={() => setConfirmRemove(m)}
                    disabled={isRemoving}
                    title={isSelf ? 'Leave board' : 'Remove member'}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                  >
                    {isSelf ? <LogOut className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {members.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-zinc-400">
          <Shield className="h-8 w-8 opacity-30" />
          <p className="text-sm">No members yet</p>
        </div>
      )}

      {/* In-app confirm modal — replaces window.confirm */}
      {confirmRemove && (
        <ConfirmModal
          message={
            confirmRemove.userId === user?.id
              ? 'Are you sure you want to leave this board?'
              : `Remove ${confirmRemove.name || confirmRemove.email} from this board?`
          }
          onConfirm={handleRemoveConfirmed}
          onCancel={() => setConfirmRemove(null)}
        />
      )}

      {editingMember && (
        <UpdateRoleModal
          boardId={boardId}
          member={editingMember}
          isCurrentUser={editingMember.userId === user?.id}
          allMembers={members}
          onClose={() => setEditingMember(null)}
          onUpdated={() => { setEditingMember(null); refresh(); }}
        />
      )}
    </div>
  );
}
