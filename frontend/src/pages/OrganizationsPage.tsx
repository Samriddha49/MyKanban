import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { orgApi } from '../api/endpoints';
import type { Organization } from '../types';
import TopNav from '../components/TopNav';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await orgApi.listMine();
      setOrganizations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await orgApi.create(newName.trim());
      setNewName('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create organization.');
    }
  };

  return (
    <div>
      <TopNav title="Kanban" />
      <div className="container">
        <div className="page-header">
          <h2>Your Organizations</h2>
        </div>
        {error && <div className="error-text">{error}</div>}
        <form className="new-entity-form" onSubmit={handleCreate}>
          <input
            placeholder="New organization name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn" type="submit">Create</button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="card-grid">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="entity-card"
                onClick={() => navigate(`/organizations/${org.id}/workspaces`)}
              >
                <h3>{org.name}</h3>
                <p>Role: {org.myRole}</p>
              </div>
            ))}
            {organizations.length === 0 && <p>No organizations yet. Create one above to get started.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
