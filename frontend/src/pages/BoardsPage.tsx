import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { boardApi } from '../api/endpoints';
import type { Board } from '../types';
import TopNav from '../components/TopNav';

const BOARD_COLORS = ['#0079bf', '#d29034', '#519839', '#b04632', '#89609e', '#cd5a91'];

export default function BoardsPage() {
  const { workspaceId } = useParams();
  const workspaceIdNum = Number(workspaceId);
  const [boards, setBoards] = useState<Board[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await boardApi.listByWorkspace(workspaceIdNum);
      setBoards(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load boards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceIdNum]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const color = BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)];
    try {
      await boardApi.create(workspaceIdNum, newName.trim(), color);
      setNewName('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create board.');
    }
  };

  return (
    <div>
      <TopNav title="Kanban" />
      <div className="container">
        <div className="page-header">
          <h2>Boards</h2>
        </div>
        {error && <div className="error-text">{error}</div>}

        <form className="new-entity-form" onSubmit={handleCreate}>
          <input placeholder="New board name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn" type="submit">Create</button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="card-grid">
            {boards.map((board) => (
              <div
                key={board.id}
                className="entity-card"
                style={{ borderTop: `4px solid ${board.backgroundColor || '#0079bf'}` }}
                onClick={() => navigate(`/boards/${board.id}`)}
              >
                <h3>{board.name}</h3>
              </div>
            ))}
            {boards.length === 0 && <p>No boards yet. Create one above.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
