import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SectionPage from './pages/SectionPage';
import DiscussBoard from './pages/DiscussBoard';
import SubpagePage from './pages/SubpagePage';
import { LogIn } from 'lucide-react';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function LogoutPage() {
  const navigate = useNavigate();
  return (
    <div className="auth-shell">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="brand-mark" style={{ margin: '0 auto 18px' }}>R</div>
        <h1 style={{ fontSize: '1.65rem', marginBottom: 8 }}>You have been signed out</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 22 }}>
          Your RanchoAP session has ended. Please sign in again to continue.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ margin: '0 auto' }}>
          <LogIn size={16} /> Return to login
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<HomePage />} />
        <Route path="section/:sectionId" element={<SectionPage />} />
        <Route path="section/:sectionId/:subId" element={<SubpagePage />} />
        <Route path="discussions" element={<DiscussBoard />} />
        <Route path="discuss" element={<Navigate to="/discussions" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/logout" replace />} />
    </Routes>
  );
}
