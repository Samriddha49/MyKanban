import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workspaceApi, orgApi } from '../api/endpoints';
import type { Workspace } from '../types';
import TopNav from '../components/TopNav';

export default function WorkspacesPage() {
  const { orgId } = useParams();
  const orgIdNum = Number(orgId);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newName, setNewName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await workspaceApi.listByOrg(orgIdNum);
      setWorkspaces(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgIdNum]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await workspaceApi.create(orgIdNum, newName.trim());
      setNewName('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create workspace.');
    }
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setInviteMsg(null);
    if (!inviteEmail.trim()) return;
    try {
      await orgApi.inviteMember(orgIdNum, inviteEmail.trim(), 'MEMBER');
      setInviteMsg(`Invited ${inviteEmail.trim()} as a member.`);
      setInviteEmail('');
    } catch (err: any) {
      setInviteMsg(err.response?.data?.message || 'Failed to invite member. They may need an account first.');
    }
  };

  return (
    <div>
      <TopNav title="Kanban" />
      <div className="container">
        <div className="page-header">
          <h2>Workspaces</h2>
        </div>
        {error && <div className="error-text">{error}</div>}

        <form className="new-entity-form" onSubmit={handleCreate}>
          <input
            placeholder="New workspace name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn" type="submit">Create</button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="card-grid">
            {workspaces.map((ws) => (
              <div key={ws.id} className="entity-card" onClick={() => navigate(`/workspaces/${ws.id}/boards`)}>
                <h3>{ws.name}</h3>
                <p>{ws.description || 'No description'}</p>
              </div>
            ))}
            {workspaces.length === 0 && <p>No workspaces yet. Create one above.</p>}
          </div>
        )}

        <div className="modal-section">
          <h4>Invite a teammate to this organization</h4>
          <form className="new-entity-form" onSubmit={handleInvite}>
            <input
              placeholder="teammate@email.com"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <button className="btn secondary" type="submit">Invite</button>
          </form>
          {inviteMsg && <p style={{ fontSize: 13 }}>{inviteMsg}</p>}
          <p style={{ fontSize: 12, color: '#5e6c84' }}>
            Note: the teammate must already have registered an account with this email.
          </p>
        </div>
      </div>
    </div>
  );
}
