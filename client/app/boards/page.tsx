'use client';

import { useEffect, useState } from 'react';
import { listBoards } from '../../lib/api/boards';
import type { BoardSummary } from '../../lib/types/board';
import { withAuth } from '../../lib/withAuth';
import CreateBoardModal from '../../components/board/CreateBoardModal';

function BoardsPage() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listBoards();
      setBoards(data);
    } catch {
      setError('Failed to load boards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoards(); }, []);

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Boards</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Board
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((b) => (
            <li key={b.id}>
              <a
                href={`/boards/${b.id}`}
                className="block p-4 border rounded-lg hover:shadow-md transition"
              >
                <p className="font-semibold text-lg">{b.name}</p>
                <span className="text-sm text-gray-500 capitalize">{b.role}</span>
              </a>
            </li>
          ))}
          {boards.length === 0 && <p className="text-gray-400">No boards yet.</p>}
        </ul>
      )}

      {showModal && (
        <CreateBoardModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchBoards(); }}
        />
      )}
    </main>
  );
}

export default withAuth(BoardsPage);
