// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) { navigate('/', { replace: true }); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = login(username, password);
    if (result.success) { navigate('/', { replace: true }); }
    else { setError(result.error); }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(145deg, #1d1d1f 0%, #3a3a3c 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: 'var(--shadow)'
          }}>
            <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-.02em' }}>R</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-.03em', marginBottom: 4 }}>RanchoAP</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Sign in to continue</p>
        </div>

        {/* Form */}
        <div className="card" style={{ padding: '28px 24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Your Name
              </label>
              <input
                className="input"
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div style={{
                background: '#ffeef0', border: '1px solid #ffc1c7',
                borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                fontSize: '.875rem', color: 'var(--danger)', marginBottom: 16
              }}>
                {error}
              </div>
            )}
            <button className="btn btn-primary w-full" type="submit" disabled={loading}
              style={{ justifyContent: 'center', padding: '10px', fontSize: '0.9375rem' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '.8125rem', color: 'var(--text-tertiary)', marginTop: 20 }}>
          Rancho Management Services (B.C.) Ltd.
        </p>
      </div>
    </div>
  );
}
