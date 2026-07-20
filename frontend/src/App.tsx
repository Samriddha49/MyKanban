import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrganizationsPage from './pages/OrganizationsPage';
import WorkspacesPage from './pages/WorkspacesPage';
import BoardsPage from './pages/BoardsPage';
import BoardPage from './pages/BoardPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<OrganizationsPage />} />
          <Route path="/organizations/:orgId/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:workspaceId/boards" element={<BoardsPage />} />
          <Route path="/boards/:boardId" element={<BoardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
