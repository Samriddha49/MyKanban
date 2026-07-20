import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function TopNav({ title }: { title?: string }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="top-nav">
      <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        {title || 'Kanban'}
      </div>
      <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13 }}>{user?.name}</span>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </div>
  );
}
